export interface CardProfile {
  name: string;
  role: string;
  company: string;
  avatar: string;
  fontFamily?: string;
  nameFontFamily?: string;
}

// Draw only when profile data changes; the resulting canvas becomes part of
// the card atlas, so the physics/render loop does no text layout work.
export function createProfileCard(avatar: HTMLImageElement, profile: Omit<CardProfile, 'avatar'>) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1520;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const paper = ctx.createLinearGradient(0, 0, 1080, 1520);
  paper.addColorStop(0, '#fafafb');
  paper.addColorStop(1, '#ededf0');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
  ctx.shadowBlur = 64;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(540, 530, 230, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(540, 530, 220, 0, Math.PI * 2);
  ctx.clip();
  const scale = Math.max(440 / avatar.width, 440 / avatar.height);
  const width = avatar.width * scale;
  const height = avatar.height * scale;
  ctx.drawImage(avatar, 540 - width / 2, 530 - height / 2, width, height);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const fontFamily = profile.fontFamily ?? 'Arial, sans-serif';
  const drawText = (text: string, y: number, size: number, weight: number, color: string, family = fontFamily, style = 'normal') => {
    ctx.font = `${style} ${weight} ${size}px ${family}`;
    const fittedSize = Math.min(size, size * 900 / Math.max(1, ctx.measureText(text).width));
    ctx.font = `${style} ${weight} ${fittedSize}px ${family}`;
    ctx.fillStyle = color;
    ctx.fillText(text, 540, y);
  };

  drawText(profile.name, 930, 136, 400, '#080808', profile.nameFontFamily ?? fontFamily);

  // Keep the role readable at the card's small on-screen size. Wrap words
  // instead of shrinking the entire title, and keep a slash with its next word.
  ctx.font = `400 86px ${fontFamily}`;
  const roleLines: string[] = [];
  let line = '';
  for (const word of profile.role.match(/\/\s+\S+|\S+/g) ?? []) {
    const nextLine = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(nextLine).width > 860) {
      roleLines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }
  if (line) roleLines.push(line);

  const roleTop = 1080;
  const roleLineHeight = 112;
  roleLines.forEach((text, index) => {
    drawText(text, roleTop + index * roleLineHeight, 86, 400, '#1b1b1f');
  });
  const companyY = roleTop + (roleLines.length - 1) * roleLineHeight + 150;
  drawText(`@${profile.company}`, companyY, 78, 400, '#3f3f46');
  return canvas;
}
