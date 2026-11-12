'use strict';

const modes = {
  study: {
    title: '学习', description: '桌面抬升，前侧形成座位，中间保留腿部空间。',
    layout: [0, 3, 3, 3, 0, 3, 3, 3, 0, 0, 0, 0, 0, 1.7, 1.7, 0],
    caption: '后侧支撑升起桌板，前侧留出腿部空间。桌面约 75 厘米。'
  },
  meal: {
    title: '用餐', description: '中间抬起一张矮餐桌，沿两侧留出坐垫区。',
    layout: [0, 0, 0, 0, 0.2, 1.65, 1.65, 0.2, 0.2, 1.65, 1.65, 0.2, 0, 0, 0, 0],
    caption: '中间四格为矮桌，两侧各留两格作为坐垫区。'
  },
  move: {
    title: '活动', description: '模块归平，腾出一块地面。伸展时可利用周围的空地。',
    layout: Array(16).fill(0), caption: '十六格全部归平，活动前仍需确认周围空间。'
  }
};
const labels = { study: '学习与阅读', meal: '用餐', move: '活动' };
const byId = (id) => document.getElementById(id);
const modeButtons = [...document.querySelectorAll('.mode-button')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const lab = byId('lab-canvas');
let current = 'study';
let selected = 'study';
let objects = 'table';
let dishes = false;
let moving = false;
let frame = 0;

function drawScene(canvas, heights, options = {}) {
  const { dark = false, mode = 'study', items = 'none', occupied = false, roommate = false, showDishes = false } = options;
  const ctx = canvas.getContext('2d');
  const origin = [388, 246];
  const project = (x, y, z = 0) => [origin[0] + (x - y) * 65, origin[1] + (x + y) * 30 - z * 51];
  const points = (vertices) => vertices.map(([x, y, z]) => project(x, y, z));

  function polygon(vertices, fill, stroke, width = 1) {
    ctx.beginPath();
    vertices.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }

  function line(a, b, color, width = 1) {
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function plane(x, y, width, depth, z, color, stroke) {
    polygon(points([[x,y,z],[x+width,y,z],[x+width,y+depth,z],[x,y+depth,z]]), color, stroke);
  }

  function box(x, y, width, depth, z, bottom, colors) {
    const a = [x,y,z], b = [x+width,y,z], c = [x+width,y+depth,z], d = [x,y+depth,z];
    polygon(points([d,c,[x+width,y+depth,bottom],[x,y+depth,bottom]]), colors[1], colors[3]);
    polygon(points([b,c,[x+width,y+depth,bottom],[x+width,y,bottom]]), colors[2], colors[3]);
    polygon(points([a,b,c,d]), colors[0], colors[3]);
  }

  function ellipse(x, y, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function cup(x, y, z) {
    const [cx, cy] = project(x, y, z);
    ellipse(cx + 5, cy + 2, 14, 6, '#0003');
    ctx.fillStyle = '#9b4936';
    ctx.fillRect(cx - 8, cy - 17, 16, 16);
    ellipse(cx, cy - 1, 8, 4, '#9b4936');
    ellipse(cx, cy - 17, 8, 4, '#d57255');
    ellipse(cx, cy - 17, 5, 2.5, '#573b2c');
  }

  function laptop(x, y, z) {
    plane(x + .08, y + .07, .93, .66, z, '#2b2b222e');
    plane(x, y, .92, .66, z + .035, '#4e554b', '#30372f');
    plane(x + .08, y + .15, .75, .29, z + .04, '#929a8d');
    polygon(points([[x,y,z],[x+.92,y,z],[x+.92,y-.1,z+.75],[x,y-.1,z+.75]]), '#3d4c41', '#202c25', 2);
    polygon(points([[x+.045,y-.02,z+.045],[x+.87,y-.02,z+.045],[x+.87,y-.085,z+.67],[x+.045,y-.085,z+.67]]), '#aebfa7');
    line(project(x+.14,y-.04,z+.22), project(x+.66,y-.04,z+.22), '#546956', 2);
    line(project(x+.14,y-.055,z+.34), project(x+.53,y-.055,z+.34), '#546956', 2);
  }

  function plate(x, y, z) {
    const [cx, cy] = project(x, y, z);
    ellipse(cx + 3, cy + 3, 25, 11, '#0003');
    ellipse(cx, cy, 24, 11, '#f6efdc');
    ellipse(cx, cy, 17, 7, '#ddd9c2');
    ellipse(cx - 3, cy, 10, 4, '#b86a48');
    ellipse(cx + 9, cy - 1, 4, 3, '#6c8152');
  }

  function person(x, y, z, color) {
    const [cx, cy] = project(x, y, z);
    ellipse(cx + 5, cy + 1, 19, 8, '#0003');
    line([cx - 5, cy - 34], [cx - 8, cy], '#282e26', 7);
    line([cx + 5, cy - 34], [cx + 9, cy], '#282e26', 7);
    polygon([[cx-12,cy-69],[cx+11,cy-69],[cx+9,cy-31],[cx-9,cy-31]], color);
    line([cx - 11, cy - 62], [cx - 17, cy - 40], color, 7);
    line([cx + 10, cy - 62], [cx + 16, cy - 40], color, 7);
    ellipse(cx, cy - 79, 9, 10, '#b8846a');
  }

  const background = ctx.createLinearGradient(0, 0, 850, 580);
  background.addColorStop(0, dark ? '#39483b' : '#efead6');
  background.addColorStop(1, dark ? '#212b23' : '#c8c9b1');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 850, 580);
  for (let x = 14; x < 850; x += 18) {
    for (let y = 14; y < 580; y += 18) {
      ctx.fillStyle = dark ? '#f0ecd31d' : '#554d3519';
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }
  ctx.save();
  ctx.filter = 'blur(19px)';
  plane(-.05, -.03, 4.48, 4.6, -.42, dark ? '#111a13d9' : '#5555476b');
  ctx.restore();

  const base = dark ? ['#777c68', '#4b5345', '#3b4538', '#353c32'] : ['#a2a38b', '#777b66', '#646b59', '#747a65'];
  box(-.14, -.14, 4.28, 4.28, -.04, -.33, base);

  const timber = ['#d6b98e', '#ad8c62', '#916e49', '#8b7456'];
  const ivory = ['#efe3c5', '#c3b18e', '#9e8c70', '#ad9c7e'];
  const fabric = ['#d16b4d', '#a85641', '#8c4335', '#8f4d3b'];
  const cells = heights.map((height, index) => ({ x: index % 4, y: Math.floor(index / 4), height }));
  cells.sort((a, b) => a.x + a.y - b.x - b.y);

  cells.forEach(({ x, y, height }) => {
    const modeSeat = mode === 'study' && y === 3 || mode === 'meal' && (x === 0 || x === 3) && (y === 1 || y === 2);
    const material = height > .08 && modeSeat ? fabric : height > .3 ? ivory : timber;
    const top = height + .13;
    const suspendedTop = mode === 'study' && height > .4 && y < 2 && x > 0 && (y === 1 || x === 2);
    if (suspendedTop) box(x + .013, y + .013, .973, .973, .13, -.04, timber);
    const bottom = suspendedTop ? top - .16 : -.04;
    box(x + .013, y + .013, .973, .973, top, bottom, material);
    if (height > .42 && !suspendedTop) {
      const near = project(x + .08, y + .988, height * .42);
      const far = project(x + .92, y + .988, height * .42);
      line(near, far, '#37312237');
    }
    if (material === timber) {
      for (let groove = 1; groove < 6; groove += 1) {
        const offset = groove * .14;
        line(project(x + .1, y + offset, top), project(x + .9, y + offset + .012, top), '#66503625');
      }
    }
  });

  const tray = ['#c9b391', '#9c855f', '#776644', '#8c7757'];
  box(4.45, .15, .77, 1.45, 1.38, -.16, tray);
  box(4.40, .10, .87, 1.55, 1.55, 1.38, ivory);
  if (items === 'table') { laptop(1.34, .35, 3.15); cup(3.26, .65, 3.16); }
  if (items === 'tray') { laptop(4.46, .33, 1.57); cup(4.99, 1.29, 1.58); }
  if (showDishes) {
    plate(1.53, 1.55, 1.80);
    if (roommate) plate(2.40, 2.45, 1.80);
  }
  if (occupied) person(1.65, 2.53, .15, '#db7456');
  if (roommate) person(3.80, 4.42, -.22, '#879d72');

  const measure = dark ? '#b6c1a8' : '#68715a';
  const left = project(-.03, 4.45, -.20);
  const right = project(4.03, 4.45, -.20);
  line(left, right, measure);
  [left, right].forEach(([x, y]) => line([x - 4, y + 7], [x + 4, y - 7], measure));
  ctx.save();
  ctx.translate((left[0] + right[0]) / 2, (left[1] + right[1]) / 2);
  ctx.rotate(Math.atan2(30, 65));
  ctx.font = '14px Consolas, monospace';
  ctx.fillStyle = measure;
  ctx.textAlign = 'center';
  ctx.fillText('1 000 mm', 0, 21);
  ctx.restore();
}

function roommatePlan() {
  if (!byId('shared').checked) return { conflict: false, text: '' };
  const need = byId('roommate').value;
  if (need === 'idle') return { conflict: false, text: '室友稍后使用。确认后由你先用地台。' };
  if (need !== selected || need === 'move') {
    return { conflict: true, text: `室友要${labels[need]}。空间无法同时满足，请先协商顺序。可让室友选择「稍后使用」，或切换为共同需要的模式。` };
  }
  return {
    conflict: false,
    text: need === 'meal' ? '共享中间的矮桌，两人分别使用两侧坐垫区。' : '保留学习桌和座位，室友在地台外侧阅读。仍需确认外侧有可用空间。'
  };
}

function drawLab(heights, preview = false) {
  drawScene(lab, heights, {
    dark: true, mode: selected,
    items: preview && objects === 'table' ? 'none' : objects,
    occupied: byId('occupied').checked && !preview,
    roommate: byId('shared').checked && byId('roommate').value !== 'idle',
    showDishes: dishes && !preview
  });
}

function update(heights, message) {
  const preview = selected !== current && !moving;
  const occupied = byId('occupied').checked;
  const shared = byId('shared').checked;
  const plan = roommatePlan();
  byId('shared-panel').hidden = !shared;
  byId('shared-message').textContent = plan.text;
  for (const button of modeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === selected));
    button.disabled = moving;
  }
  byId('scene-mode').textContent = `${moving ? '正在变形' : preview ? '预览' : '当前'} · ${modes[selected].title}`;
  byId('scene-caption').textContent = modes[selected].caption;
  lab.setAttribute('aria-label', `${modes[selected].title}地台${preview ? '预览' : '布局'}，${modes[selected].caption}`);
  byId('control-title').textContent = `${modes[selected].title}模式`;
  byId('control-description').textContent = modes[selected].description;
  byId('item-status').textContent = dishes ? '餐桌有餐盘' : objects === 'table' ? '桌面有电脑和水杯' : '电脑和水杯在固定侧台';
  byId('item-button').textContent = dishes ? '收走餐盘' : objects === 'table' ? '移到固定侧台' : '放回学习桌';
  byId('item-button').hidden = !dishes && objects === 'tray' && current !== 'study';
  byId('item-button').disabled = moving;
  ['occupied', 'shared', 'roommate', 'reset-button'].forEach((id) => { byId(id).disabled = moving; });
  const blockers = [];
  if (occupied) blockers.push('地台上有人');
  if (objects === 'table' || dishes) blockers.push('桌面物品未移走');
  if (plan.conflict) blockers.push('两人的空间需求冲突');
  byId('apply-button').disabled = !preview;
  const notice = moving ? '正在模拟升降。' : preview && blockers.length ? `暂不能变形：${blockers.join('、')}。` : preview ? '准备就绪，可确认变形。' : '选择上方的时间，查看另一种布局。';
  byId('feedback').textContent = message || notice;
  byId('feedback').classList.toggle('warning', preview && blockers.length > 0);
  drawLab(heights || modes[selected].layout, preview);
  return blockers;
}

function transform() {
  if (moving || current === selected) return;
  const blockers = update();
  if (blockers.length) return;
  const from = modes[current].layout;
  const to = modes[selected].layout;
  moving = true;
  const start = performance.now();
  const duration = reducedMotion.matches ? 0 : 790;
  function animate(now) {
    const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
    const eased = progress * progress * (3 - 2 * progress);
    if (progress < 1) {
      drawLab(from.map((height, index) => height + (to[index] - height) * eased));
      frame = requestAnimationFrame(animate);
      return;
    }
    current = selected;
    dishes = current === 'meal';
    moving = false;
    update(null, `已切换至${modes[current].title}模式。`);
  }
  update(from);
  frame = requestAnimationFrame(animate);
}

modeButtons.forEach((button) => button.addEventListener('click', () => { selected = button.dataset.mode; update(); }));
['occupied', 'shared', 'roommate'].forEach((id) => byId(id).addEventListener('change', () => update()));
byId('item-button').addEventListener('click', () => {
  if (dishes) dishes = false;
  else objects = objects === 'table' ? 'tray' : 'table';
  update();
});
byId('apply-button').addEventListener('click', transform);
byId('reset-button').addEventListener('click', () => {
  cancelAnimationFrame(frame);
  current = selected = 'study';
  objects = 'table';
  dishes = false;
  moving = false;
  byId('occupied').checked = false;
  byId('shared').checked = false;
  byId('roommate').value = 'study';
  update(null, '已恢复到学习模式，电脑和水杯在桌面上。');
});

drawScene(byId('hero-canvas'), modes.study.layout, { items: 'table' });
update();
