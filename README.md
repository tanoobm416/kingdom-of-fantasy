# Beyond the Page · Kingdom of Fantasy

A standalone Three.js fantasy world. The printed QR opens the public URL. Exploration runs in the browser and needs no camera permission.

## Launch on iPhone

1. Print `dist/downloads/kingdom-qr-print.pdf` or place `kingdom-qr.png` in your page layout. Leave the white quiet zone intact. Open the iPhone Camera app and scan the code.
2. Tap the link to open the [Kingdom](https://beyond-the-page-kingdom.knowinghull8.chatgpt.site) in Safari. Tap **ENTER THE KINGDOM**.
3. Drag to look around. Pinch to move closer, or use two fingers to pan. The circular arrow resets the view while preserving the encounter.
4. After the gate rises, tap the amber moth. Follow it to the marked stone, tap the stone, and inspect the open compass. You can continue exploring afterward.

Use a browser with WebGL enabled. On desktop, drag to orbit, scroll to zoom, or right-drag to pan. With the world canvas focused, the arrow keys orbit and plus or minus zoom. The highlighted objects also have focusable action buttons.

## Build and deploy

Use Node 20 or later, then run `npm ci`, `npm run build`, and `npm test`. Serve `dist/` as the web root. For local development, `python3 -m http.server 8080 --directory dist` serves the home document at `http://localhost:8080`. On Cloudflare Pages, create a Pages project with Direct Upload and select `dist/`. No variables or build command are needed to host the prebuilt folder. To use a different origin, regenerate the PNG with `node tools/qr.mjs https://your-domain.example/` and replace the printable PDF with a print of that updated code.

`src/island.js` builds reusable terrain and character meshes along with the painted vista and inscription textures. `src/landscape.js` adds distant scenery, grass, shadows, and particles. `tools/castle.mjs` generates the reusable castle GLB. `src/camera.js` contains exploration controls, and `src/encounter.js` controls the adventure sequence. All runtime assets are bundled locally.

## WebXR on iPhone

A reliable immersive AR session would require Safari to expose WebXR and return true from `navigator.xr.isSessionSupported('immersive-ar')`. iPhone Safari does not provide dependable support for that session type. This release uses full-screen perspective 3D without WebXR. See [Apple Developer Forums](https://developer.apple.com/forums/thread/756850) and [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Lifecycle).

## The Kingdom of Fantasy map

After the arch rises, choose **Meet the moth**. The moth will fly to Geronimo and invite him through the golden gate. Then tap the arch or choose **Open the kingdom map**. You can still follow the moth to the compass. The map is an original illustrated atlas that follows the order of the Book 1 kingdoms. Tap a region’s landmark or gemstone label to visit it.

| Kingdom | Gemstone | Display |
| --- | --- | --- |
| Witches | Ruby | Queen Cackle, the Fortress of Fear and the Wicked Witch Woods |
| Mermaids | Topaz | Queen Aquafin and the rose-colored Coral Castle |
| Dragons | Citrine | King Firebreath III’s Dragonaire, the volcano palace and the dragon runway |
| Pixies | Emerald | King Chuckles’s Big Bluebell |
| Gnomes | Sapphire | King Factual and Queen Cozy’s Big Bark Lodge |
| Giants | Amethyst | Strongheart and the snowy crags of Falcon’s Beak |
| Fairies | Diamond | Queen Blossom’s Crystal Castle |

**Return to the map** takes you back from any kingdom. The island marker returns to your camera view and encounter progress.

The first tap unlocks audio. The island has a quiet instrumental loop with a flutter during the moth’s flight. Each kingdom has an original soundscape, from underwater tones in Coral Castle to an icy wind in the Giants’ kingdom. Use **Sound on/off** to control music and effects. Tap a creature or its action label to see its response and read its dialogue. Knock on Aquafin’s clamshell, ask Cackle to cast a spell, or challenge Strongheart to split a boulder.

The displays are original models grounded in the first book’s characters and landmarks. References include the [Scholastic Book 1 listing](https://www.scholastic.ca/our-books/book/geronimo-stilton-and-the-kingdom-of-fantasy-1-the-kingdom-of-fantasy-9780545980258), the [Book 1 preview](https://books.google.com/books/about/The_Kingdom_of_Fantasy_Geronimo_Stilton.html?id=AvBvB2Ux7UUC), and the [series location index](https://geronimostilton.fandom.com/wiki/The_Kingdom_of_Fantasy_%28place%29).
