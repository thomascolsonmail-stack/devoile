/**
 * Génère un aperçu flouté irréversible : l'image est réduite à une taille
 * minuscule puis floutée avant d'être ré-encodée. À cette résolution, aucun
 * détail exploitable ne survit — contrairement à un flou CSS appliqué sur
 * l'image originale, qui elle reste téléchargeable telle quelle.
 */
export async function generateBlurredPreview(buffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(buffer)
    .rotate() // respecte l'orientation EXIF avant de tout écraser
    .resize(28, 28, { fit: "cover" })
    .blur(3)
    .jpeg({ quality: 45 })
    .toBuffer();
}
