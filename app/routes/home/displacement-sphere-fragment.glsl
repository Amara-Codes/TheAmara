#define PHONG

// Uniforms standard di Three.js per il materiale Phong
uniform vec3 diffuse;
uniform vec3 emissive; // Emissività di base (dal materiale JS)
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

// Uniforms personalizzati dal codice JS
uniform float time;

// Varying passati dal Vertex Shader
varying vec2 vUv;
varying vec3 newPosition;
varying float noise;

// Include standard di Three.js
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

    // --- CALCOLI ORIGINALI MANTENUTI ---
    vec3 color = vec3(vUv * (0.2 - 2.0 * noise), 1.0);
    vec3 finalColors = vec3(color.b * 1.5, color.r, color.r);
    // Calcola il colore basato sulla logica originale (prima dava celeste/variazioni)
    vec3 originalCalculatedColor = cos(finalColors * noise * 3.0);
    vec4 diffuseColor = vec4(originalCalculatedColor, 1.0); // Alpha=1.0

    // --- INIZIO MODIFICA ---

    // 1. Definisci il colore blu target (leggermente più chiaro: #18283a normalizzato)
    vec3 targetBlue = vec3(0.094, 0.157, 0.227);

    // 2. Mescola il colore calcolato originale con il blu target
    //    Un fattore di 0.75 dà 75% di blu target e 25% di colore originale,
    //    reintroducendo variazioni ma mantenendo una forte tinta blu.
    //    Puoi giocare con questo valore (0.0 - 1.0) per più o meno variazione.
    float mixFactor = 0.75;
    diffuseColor.rgb = mix(diffuseColor.rgb, targetBlue, mixFactor);

    // 3. Aggiungi un po' di emissione per luminosità generale
    //    Prendi l'emissività base dal materiale e aggiungi una frazione
    //    del nostro blu target. Un valore piccolo (es. 0.1-0.3) basta.
    //    Questo aiuta a schiarire le ombre.
    vec3 totalEmissiveRadiance = emissive + (targetBlue * 0.2); // Aggiunge 20% del blu come emissione

    // --- FINE MODIFICA ---

    ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
    // totalEmissiveRadiance è già stato definito sopra

	#include <logdepthbuf_fragment>
    // Gli include successivi useranno il diffuseColor mescolato e l'emissività aumentata
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment> // Usa totalEmissiveRadiance

	// Calcoli di illuminazione Phong
	#include <lights_phong_fragment> // Usa diffuseColor.rgb e totalEmissiveRadiance
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

    // Include finali
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

    // Output finale basato sull'illuminazione e modifiche
    gl_FragColor = vec4(outgoingLight, diffuseColor.a);
}