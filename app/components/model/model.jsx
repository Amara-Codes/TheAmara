import { animate, useReducedMotion, useSpring } from 'framer-motion';
import { useInViewport } from '~/hooks'; // Assicurati che questo hook esista
import {
  createRef,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib';
import { resolveSrcFromSrcSet } from '~/utils/image'; // Assicurati che esista
import { classes, cssProps, numToMs } from '~/utils/style'; // Assicurati che esista
import {
  cleanRenderer,
  cleanScene,
  modelLoader,
  removeLights,
  textureLoader,
} from '~/utils/three'; // Assicurati che esista
import { ModelAnimationType } from './device-models'; // Assumi che esista e sia corretto
import { throttle } from '~/utils/throttle'; // Assicurati che esista
import styles from './model.module.css';

const MeshType = {
  Frame: 'Frame',
  Logo: 'Logo',
  Screen: 'Screen',
};

const rotationSpringConfig = {
  stiffness: 40,
  damping: 20,
  mass: 1.4,
  restSpeed: 0.001,
};

// --- Valori di Intensità Luce di Default ---
const DEFAULT_AMBIENT_INTENSITY = 1.2;
const DEFAULT_KEY_LIGHT_INTENSITY = 1.1;
const DEFAULT_FILL_LIGHT_INTENSITY = 0.8;
const FILL_TO_KEY_RATIO = DEFAULT_FILL_LIGHT_INTENSITY / DEFAULT_KEY_LIGHT_INTENSITY;


export const Model = ({
  models,
  show = true,
  showDelay = 0,
  cameraPosition = { x: 0, y: 0, z: 8 }, // Posizione iniziale X, Y e Z di fallback
  style,
  className,
  onLoad,
  alt,
  ambientLightIntensity,       // Prop per intensità ambiente
  directionalLightIntensity, // Prop per intensità direzionale
  scale = 1,                 // <-- NUOVA PROP: Scala del modello (default 1)
  cameraDistance,            // <-- NUOVA PROP: Distanza Z della camera (per zoom)
  ...rest
}) => {
  const container = useRef();
  const canvas = useRef();
  const camera = useRef();
  const modelGroup = useRef();
  const scene = useRef();
  const renderer = useRef();
  const shadowGroup = useRef();
  const renderTarget = useRef();
  const renderTargetBlur = useRef();
  const shadowCamera = useRef();
  const depthMaterial = useRef();
  const horizontalBlurMaterial = useRef();
  const verticalBlurMaterial = useRef();
  const plane = useRef();
  const lights = useRef();
  const blurPlane = useRef();
  const fillPlane = useRef();
  const [loaded, setLoaded] = useState(false); // Stato per il caricamento (spostato qui)

  const isInViewport = useInViewport(container, false, { threshold: 0.2 });
  const reduceMotion = useReducedMotion();
  const rotationX = useSpring(0, rotationSpringConfig);
  const rotationY = useSpring(0, rotationSpringConfig);

  // --- Funzione di Rendering (useCallback per stabilità) ---
  const renderFrame = useCallback(() => {
    if (!renderer.current || !scene.current || !camera.current || !modelGroup.current) return; // Check refs exist

    const blurAmount = 5; // Ombre: quantità di blur

    // Passata per le ombre (depth)
    const initialBackground = scene.current.background;
    scene.current.background = null;
    scene.current.overrideMaterial = depthMaterial.current;
    renderer.current.setRenderTarget(renderTarget.current);
    renderer.current.render(scene.current, shadowCamera.current);
    scene.current.overrideMaterial = null; // Resetta override

    // Passate per il blur delle ombre
    blurShadow(blurAmount);
    blurShadow(blurAmount * 0.4); // Seconda passata più leggera

    // Reset e rendering scena normale
    renderer.current.setRenderTarget(null); // Renderizza sullo schermo
    scene.current.background = initialBackground;

    // Applica rotazione dal mouse (springs)
    modelGroup.current.rotation.x = rotationX.get();
    modelGroup.current.rotation.y = rotationY.get();

    // Render finale
    renderer.current.render(scene.current, camera.current);
  // Aggiungere tutte le dipendenze usate DENTRO la funzione renderFrame che cambiano
  // In questo caso, blurShadow, rotationX, rotationY sembrano le dipendenze dinamiche principali
  // Le refs (camera, modelGroup, scene, renderer) non cambiano, quindi non servono nelle dipendenze.
  }, [rotationX, rotationY /*, blurShadow - vedi sotto */]);


  // --- Setup Iniziale Scena (useEffect con []) ---
  useEffect(() => {
    const { clientWidth, clientHeight } = container.current;

    // Renderer
    renderer.current = new WebGLRenderer({
      canvas: canvas.current,
      alpha: true,
      antialias: false, // Potresti voler mettere true per meno seghettature
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: true,
    });
    renderer.current.setPixelRatio(window.devicePixelRatio); // Usa pixel ratio del device
    renderer.current.setSize(clientWidth, clientHeight);
    renderer.current.outputColorSpace = SRGBColorSpace;

    // Camera
    camera.current = new PerspectiveCamera(36, clientWidth / clientHeight, 0.1, 100);
    // Imposta posizione INIZIALE usando cameraPosition per X/Y e cameraDistance (se fornita) o cameraPosition.z per Z
    const initialZ = cameraDistance !== undefined ? cameraDistance : cameraPosition.z;
    camera.current.position.set(cameraPosition.x, cameraPosition.y, initialZ);
    scene.current = new Scene();

    // Gruppo Modelli
    modelGroup.current = new Group();
    scene.current.add(modelGroup.current);

    // Gestione Luci con Props
    const finalAmbientIntensity = ambientLightIntensity !== undefined ? ambientLightIntensity : DEFAULT_AMBIENT_INTENSITY;
    const finalKeyIntensity = directionalLightIntensity !== undefined ? directionalLightIntensity : DEFAULT_KEY_LIGHT_INTENSITY;
    const finalFillIntensity = finalKeyIntensity * FILL_TO_KEY_RATIO;

    const ambientLight = new AmbientLight(0xffffff, finalAmbientIntensity);
    const keyLight = new DirectionalLight(0xffffff, finalKeyIntensity);
    const fillLight = new DirectionalLight(0xffffff, finalFillIntensity);
    fillLight.position.set(-6, 2, 2);
    keyLight.position.set(0.5, 0, 0.866);
    lights.current = [ambientLight, keyLight, fillLight];
    lights.current.forEach(light => scene.current.add(light));

    // Setup Ombre (codice complesso, lasciato invariato dalla versione originale)
    shadowGroup.current = new Group();
    scene.current.add(shadowGroup.current);
    shadowGroup.current.position.set(0, 0, -0.8);
    shadowGroup.current.rotateX(Math.PI / 2);

    const renderTargetSize = 512;
    const planeWidth = 8;
    const planeHeight = 8;
    const cameraHeight = 1.5;
    const shadowOpacity = 0.8;
    const shadowDarkness = 3;

    renderTarget.current = new WebGLRenderTarget(renderTargetSize, renderTargetSize);
    renderTarget.current.texture.generateMipmaps = false;
    renderTargetBlur.current = new WebGLRenderTarget(renderTargetSize, renderTargetSize);
    renderTargetBlur.current.texture.generateMipmaps = false;
    const planeGeometry = new PlaneGeometry(planeWidth, planeHeight).rotateX(Math.PI / 2);
    const planeMaterial = new MeshBasicMaterial({ map: renderTarget.current.texture, opacity: shadowOpacity, transparent: true });
    plane.current = new Mesh(planeGeometry, planeMaterial);
    plane.current.scale.y = -1;
    shadowGroup.current.add(plane.current);
    blurPlane.current = new Mesh(planeGeometry);
    blurPlane.current.visible = false;
    shadowGroup.current.add(blurPlane.current);
    const fillMaterial = new MeshBasicMaterial({ color: 0xffffff, opacity: 0, transparent: true });
    fillPlane.current = new Mesh(planeGeometry, fillMaterial);
    fillPlane.current.rotateX(Math.PI);
    fillPlane.current.position.y -= 0.00001;
    shadowGroup.current.add(fillPlane.current);
    shadowCamera.current = new OrthographicCamera(-planeWidth / 2, planeWidth / 2, planeHeight / 2, -planeHeight / 2, 0, cameraHeight);
    shadowCamera.current.rotation.x = Math.PI / 2;
    shadowGroup.current.add(shadowCamera.current);
    depthMaterial.current = new MeshDepthMaterial();
    depthMaterial.current.userData.darkness = { value: shadowDarkness };
    depthMaterial.current.onBeforeCompile = shader => {
      shader.uniforms.darkness = depthMaterial.current.userData.darkness;
      shader.fragmentShader = `
        uniform float darkness;
        ${shader.fragmentShader.replace(
          'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
          'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'
        )}
      `;
    };
    depthMaterial.current.depthTest = false;
    depthMaterial.current.depthWrite = false;
    horizontalBlurMaterial.current = new ShaderMaterial(HorizontalBlurShader);
    horizontalBlurMaterial.current.depthTest = false;
    verticalBlurMaterial.current = new ShaderMaterial(VerticalBlurShader);
    verticalBlurMaterial.current.depthTest = false;
    // --- Fine Setup Ombre ---

    // Unsubscribe alle springs quando il componente viene smontato
    const unsubscribeX = rotationX.on('change', renderFrame);
    const unsubscribeY = rotationY.on('change', renderFrame);

    // Cleanup
    return () => {
      renderTarget.current?.dispose();
      renderTargetBlur.current?.dispose();
      removeLights(lights.current);
      cleanScene(scene.current);
      cleanRenderer(renderer.current);
      unsubscribeX();
      unsubscribeY();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // L'array vuoto è INTENZIONALE: questo setup deve avvenire solo una volta.

  // --- Funzione Blur Ombre (useCallback per stabilità) ---
  const blurShadow = useCallback(amount => {
      if (!blurPlane.current || !horizontalBlurMaterial.current || !verticalBlurMaterial.current || !renderTarget.current || !renderTargetBlur.current || !renderer.current || !shadowCamera.current) return; // Check refs

      blurPlane.current.visible = true;

      // Blur orizzontale
      blurPlane.current.material = horizontalBlurMaterial.current;
      blurPlane.current.material.uniforms.tDiffuse.value = renderTarget.current.texture;
      horizontalBlurMaterial.current.uniforms.h.value = amount * (1 / 256);
      renderer.current.setRenderTarget(renderTargetBlur.current);
      renderer.current.render(blurPlane.current, shadowCamera.current);

      // Blur verticale
      blurPlane.current.material = verticalBlurMaterial.current;
      blurPlane.current.material.uniforms.tDiffuse.value = renderTargetBlur.current.texture;
      verticalBlurMaterial.current.uniforms.v.value = amount * (1 / 256);
      renderer.current.setRenderTarget(renderTarget.current);
      renderer.current.render(blurPlane.current, shadowCamera.current);

      blurPlane.current.visible = false;
  // Le refs non cambiano, quindi non servono nelle dipendenze
  }, []);

  // Includi blurShadow nelle dipendenze di renderFrame se necessario
  // const renderFrame = useCallback(() => { ... }, [rotationX, rotationY, blurShadow]);


  // --- NUOVO: useEffect per SCALA DINAMICA ---
  useEffect(() => {
    if (modelGroup.current) {
      modelGroup.current.scale.set(scale, scale, scale);
      renderFrame(); // Aggiorna la vista
    }
  }, [scale, renderFrame]); // Riesegui quando 'scale' cambia

  // --- NUOVO: useEffect per ZOOM DINAMICO (Distanza Camera) ---
  useEffect(() => {
    if (camera.current && cameraDistance !== undefined) {
      camera.current.position.z = cameraDistance;
      // camera.current.updateProjectionMatrix(); // Di solito non serve per solo cambio di posizione
      renderFrame(); // Aggiorna la vista
    }
  }, [cameraDistance, renderFrame]); // Riesegui quando 'cameraDistance' cambia

  // --- useEffect per Rotazione Mouse ---
  useEffect(() => {
    const onMouseMove = throttle(event => {
      const { innerWidth, innerHeight } = window;
      const position = {
        x: (event.clientX - innerWidth / 2) / innerWidth,
        y: (event.clientY - innerHeight / 2) / innerHeight,
      };
      // Ridurre la sensibilità se necessario (es. position.x / 4)
      rotationY.set(position.x / 2);
      rotationX.set(position.y / 2);
    }, 100); // Throttle per performance

    if (isInViewport && !reduceMotion) {
      window.addEventListener('mousemove', onMouseMove);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isInViewport, reduceMotion, rotationX, rotationY]);

  // --- useEffect per Resize Finestra ---
  useEffect(() => {
    const handleResize = () => {
      if (!container.current || !renderer.current || !camera.current) return;
      const { clientWidth, clientHeight } = container.current;
      renderer.current.setSize(clientWidth, clientHeight);
      camera.current.aspect = clientWidth / clientHeight;
      camera.current.updateProjectionMatrix(); // Necessario dopo cambio aspect ratio
      renderFrame();
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Chiama subito per impostare dimensioni iniziali corrette
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [renderFrame]); // Dipende da renderFrame per ridisegnare

  // --- Rendering del Componente ---
  return (
    <div
      className={classes(styles.model, className)}
      data-loaded={loaded}
      style={cssProps({ delay: numToMs(showDelay) }, style)}
      ref={container}
      role="img"
      aria-label={alt}
      {...rest}
    >
      <canvas className={styles.canvas} ref={canvas} />
      {/* Mappa sui modelli e renderizza un Device per ciascuno */}
      {models.map((modelItem, index) => (
        <Device
          key={modelItem.url || index} // Usa una chiave univoca
          renderer={renderer}
          modelGroup={modelGroup}
          show={show}
          showDelay={showDelay}
          renderFrame={renderFrame} // Passa la funzione di rendering stabile
          index={index}
          setLoaded={setLoaded} // Passa setLoaded per aggiornare lo stato globale
          onLoad={onLoad}      // Passa callback onLoad originale
          model={modelItem}   // Passa l'oggetto modello specifico
        />
      ))}
    </div>
  );
};

// --- Componente Interno Device (Logica Caricamento Modello Singolo) ---
// (Lasciato funzionalmente identico all'originale, ma con piccoli fix e chiarezza)
const Device = ({
  renderer,
  model, // Oggetto modello per questo device
  modelGroup,
  renderFrame,
  index,
  showDelay,
  setLoaded, // Funzione per aggiornare lo stato loaded nel parent
  onLoad,    // Callback originale da chiamare
  show,
}) => {
  const [loadDevice, setLoadDevice] = useState(); // Contiene la funzione per iniziare il caricamento
  const reduceMotion = useReducedMotion();
  const placeholderScreen = useRef(); // Usato useRef invece di createRef per coerenza

  useEffect(() => {
    // Funzione per applicare texture allo schermo
    const applyScreenTexture = async (texture, node) => {
        if (!texture || !node?.material || !renderer.current) return; // Safety checks
        texture.colorSpace = SRGBColorSpace;
        texture.flipY = false; // Spesso necessario per texture caricate
        texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
        texture.generateMipmaps = false; // Mipmaps non servono qui

        await renderer.current.initTexture(texture); // Decodifica texture

        node.material.color = new Color(0xffffff); // Rende lo schermo bianco per mostrare texture
        node.material.transparent = true;          // Necessario per opacity
        node.material.map = texture;
        node.material.needsUpdate = true; // Importante
    };

    // Funzione principale che carica modello e texture (verrà chiamata da un altro useEffect)
    const load = async () => {
      const { texture, position, url, animation: modelAnimation } = model; // Rinominato animation
      let loadFullResTexture; // Funzione per caricare texture ad alta risoluzione
      let playAnimation;      // Funzione per avviare animazione di entrata

      if (!url) {
          console.warn("Modello senza URL:", model);
          return {}; // Ritorna oggetto vuoto se manca URL
      }

      // Carica placeholder e modello 3D in parallelo
      const [placeholder, gltf] = await Promise.all([
        texture?.placeholder ? textureLoader.loadAsync(texture.placeholder) : Promise.resolve(null),
        modelLoader.loadAsync(url),
      ]);

      // Aggiungi la scena del modello al gruppo principale
      if (!modelGroup.current || !gltf?.scene) return {}; // Safety check
      modelGroup.current.add(gltf.scene);

      // Attraversa la scena per trovare nodi specifici (es. schermo)
      gltf.scene.traverse(async node => {
        if (node.material) {
          // Imposta proprietà materiali di base se necessario
           node.material.color = new Color(0x666666); // Colore grigio base per mesh non-schermo
           node.material.needsUpdate = true;
        }

        // Gestione Schermo (se esiste texture e nodo Screen)
        if (texture && node.name === MeshType.Screen) {
          // Clona il nodo schermo per creare un placeholder temporaneo
          placeholderScreen.current = node.clone();
          placeholderScreen.current.material = node.material.clone();
          node.parent?.add(placeholderScreen.current); // Aggiungi al parent del nodo originale
          placeholderScreen.current.material.opacity = 1;
          placeholderScreen.current.position.z += 0.001; // Sposta leggermente avanti per evitare z-fighting

          // Applica il placeholder se caricato
          if (placeholder) {
              await applyScreenTexture(placeholder, placeholderScreen.current);
          } else {
               // Se non c'è placeholder, rendi il placeholder trasparente subito
               placeholderScreen.current.material.opacity = 0;
          }

          // Funzione per caricare e applicare la texture ad alta risoluzione
          loadFullResTexture = async () => {
            if (!texture?.src) return; // Non caricare se manca src
            try {
                const image = await resolveSrcFromSrcSet(texture); // Risolve src/srcset
                const fullSize = await textureLoader.loadAsync(image);
                await applyScreenTexture(fullSize, node); // Applica al nodo originale

                // Anima l'opacità del placeholder per farlo sparire
                animate(placeholderScreen.current.material.opacity, 0, {
                  duration: 0.5, // Durata dissolvenza
                  onUpdate: value => {
                    if (placeholderScreen.current?.material) {
                        placeholderScreen.current.material.opacity = value;
                    }
                    renderFrame(); // Aggiorna durante animazione
                  },
                  onComplete: () => {
                      // Rimuovi il placeholder dalla scena una volta invisibile
                      if(placeholderScreen.current?.parent) {
                          placeholderScreen.current.parent.remove(placeholderScreen.current);
                          placeholderScreen.current = null; // Pulisci ref
                      }
                  }
                });
            } catch (error) {
                console.error("Errore caricamento full-res texture:", error);
                // Nascondi placeholder anche se fallisce il caricamento full-res
                 if (placeholderScreen.current?.material) placeholderScreen.current.material.opacity = 0;

            }
          };
        }
      });

      // Imposta posizione finale del modello
      const targetPosition = new Vector3(position?.x || 0, position?.y || 0, position?.z || 0);

      // Se reduceMotion è attivo, imposta subito la posizione finale
      if (reduceMotion) {
        gltf.scene.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
      }

      // Definizione delle animazioni di entrata
      // Animazione SpringUp
      if (!reduceMotion && modelAnimation === ModelAnimationType.SpringUp) {
        playAnimation = () => {
          const startPosition = new Vector3(targetPosition.x, targetPosition.y - 1, targetPosition.z);
          gltf.scene.position.set(startPosition.x, startPosition.y, startPosition.z);

          animate(startPosition.y, targetPosition.y, {
            type: 'spring',
            delay: (300 * index + showDelay) / 1000,
            stiffness: 60, damping: 20, mass: 1, restSpeed: 0.0001, restDelta: 0.0001,
            onUpdate: value => { gltf.scene.position.y = value; renderFrame(); },
          });
        };
      }
      // Animazione LaptopOpen
      else if (!reduceMotion && modelAnimation === ModelAnimationType.LaptopOpen) {
        playAnimation = () => {
          const frameNode = gltf.scene.children.find(node => node.name === MeshType.Frame);
          if (!frameNode) return; // Non animare se non trova il frame
          const startRotation = new Vector3(MathUtils.degToRad(90), 0, 0);
          const endRotation = new Vector3(0, 0, 0);
          gltf.scene.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
          frameNode.rotation.set(startRotation.x, startRotation.y, startRotation.z);

          animate(startRotation.x, endRotation.x, {
            type: 'spring',
            delay: (300 * index + showDelay + 300) / 1000, // Ritardo aggiuntivo
            stiffness: 80, damping: 20, restSpeed: 0.0001, restDelta: 0.0001,
            onUpdate: value => { frameNode.rotation.x = value; renderFrame(); },
          });
        };
      }
      else {
           // Se non c'è animazione specifica o reduceMotion è true, imposta la posizione finale
            gltf.scene.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
      }

      return { loadFullResTexture, playAnimation }; // Ritorna le funzioni per usarle dopo
    };

    // Salva la funzione 'load' nello stato per poterla chiamare nell'altro useEffect
    setLoadDevice({ start: load });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, modelGroup, renderer, index, showDelay, reduceMotion, renderFrame]); // Dipendenze per la definizione del caricamento

  // --- useEffect che ESEGUE il caricamento e le animazioni ---
  useEffect(() => {
    if (!loadDevice || !show) return; // Non fare nulla se non deve mostrare o se load non è pronto

    let animationControl; // Per fermare l'animazione framer-motion se necessario

    const executeLoad = async () => {
      try {
        const { loadFullResTexture, playAnimation } = await loadDevice.start();

        setLoaded(true); // Segnala che questo device è (almeno inizialmente) caricato
        onLoad?.();       // Chiama callback onLoad generale

        // Avvia animazione di entrata (se esiste e non reduceMotion)
        if (playAnimation && !reduceMotion) {
           playAnimation(); // Non serve salvare il controllo qui se non serve fermarla
        }

         // Carica texture ad alta risoluzione (se la funzione esiste)
         if (loadFullResTexture) {
           await loadFullResTexture();
         }

        // Renderizza un frame finale in caso di reduceMotion o nessuna animazione
        if (reduceMotion || !playAnimation) {
             renderFrame();
        }

      } catch (error) {
          console.error("Errore durante l'esecuzione del caricamento del device:", error);
          setLoaded(true); // Segna come caricato anche in caso di errore per non bloccare UI
          onLoad?.();    // Chiama comunque onLoad
      }
    };

    // Usa startTransition per non bloccare UI durante caricamento pesante
    startTransition(() => {
      executeLoad();
    });

    // Cleanup (non c'è molto da pulire qui a meno che non si fermino animazioni)
    return () => {
      // animationControl?.stop(); // Se avessi salvato il controllo di animate
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDevice, show, reduceMotion, setLoaded, onLoad, renderFrame]); // Dipendenze per l'esecuzione del caricamento

  // Questo componente non renderizza direttamente elementi nel DOM, ma agisce sulla scena Three.js
  return null;
};