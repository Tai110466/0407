let gameState = 'START'; // START, LEVEL_SELECT, WAITING_TO_START, PLAYING, GAMEOVER, WIN
let difficulty = 1;      // 1: 簡單, 2: 中等, 3: 困難
let wallColor = [50, 50, 50]; // 牆壁顏色 (深灰色)
let hazardColor = [255, 50, 50]; // 障礙物顏色 (亮紅色)
let pathTop = [];        // 儲存上方路徑的 5 個點
let pathBottom = [];     // 儲存下方路徑的 5 個點
let particles = [];      // 儲存粒子物件的陣列

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  initPath();
}

function initPath() {
  pathTop = [];
  pathBottom = [];
  
  // 根據難度決定點的數量，實現「由少到多」的差異
  // 簡單: 4 點, 中等: 8 點, 困難: 14 點
  let numPoints = 4 + (difficulty - 1) * 5;
  
  // 根據難度決定路徑寬度 (間距)
  let gap = map(difficulty, 1, 3, 55, 25);
  
  for (let i = 0; i < numPoints; i++) {
    let x = (width / (numPoints - 1)) * i;
    let y = random(100, height - 100 - gap);
    pathTop.push({x: x, y: y});
    pathBottom.push({x: x, y: y + gap});
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initPath();
  particles = []; // 視窗縮放時清除粒子
}

function draw() {
  drawBackground();

  if (gameState === 'START') {
    drawMenu();
  } else if (gameState === 'LEVEL_SELECT') {
    drawLevelSelect();
  } else if (gameState === 'WAITING_TO_START') {
    drawWaiting();
  } else if (gameState === 'PLAYING') {
    playGame();
  } else if (gameState === 'GAMEOVER') {
    drawEndScreen("遊戲結束！", color(255, 0, 0), "點擊畫面返回主選單");
  } else if (gameState === 'WIN') {
    let sub = (difficulty < 3) ? "點擊進入下一關" : "全關卡達成！點擊返回主選單";
    drawEndScreen("恭喜通關！", color(0, 150, 0), sub);
  }

  // 在每一幀更新並繪製粒子尾巴
  updateParticles();
}

function drawBackground() {
  background(10, 15, 30); // 深藍黑色背景

  // 1. 繪製流動的網格線
  stroke(30, 50, 100, 150);
  strokeWeight(1);
  let gridSize = 50;
  let offsetX = (frameCount * 0.5) % gridSize;
  let offsetY = (frameCount * 0.5) % gridSize;

  for (let x = offsetX; x < width; x += gridSize) {
    line(x, 0, x, height);
  }
  for (let y = offsetY; y < height; y += gridSize) {
    line(0, y, width, y);
  }

  // 2. 增加一些遠處的裝飾點 (電子塵埃)
  noStroke();
  fill(100, 150, 255, 150);
  for (let i = 0; i < 15; i++) {
    let nx = noise(i, frameCount * 0.002) * width;
    let ny = noise(i + 50, frameCount * 0.002) * height;
    ellipse(nx, ny, 2, 2);
  }
}

function drawMenu() {
  fill(200, 230, 255); // 淺藍色文字
  textSize(50);
  text("曲線電流急急棒", width / 2, height / 2 - 50);
  textSize(20);
  text("點擊畫面進入數位迷宮", width / 2, height / 2 + 50);
}

function drawLevelSelect() {
  fill(255);
  textSize(30);
  text("請選擇難度", width / 2, height / 4);
  
  let btnW = 200, btnH = 60;
  let levels = ["簡單 (Easy)", "中等 (Medium)", "困難 (Hard)"];
  
  for (let i = 0; i < 3; i++) {
    fill(200);
    if (mouseX > width/2 - btnW/2 && mouseX < width/2 + btnW/2 && 
        mouseY > height/3 + i*100 && mouseY < height/3 + i*100 + btnH) {
      fill(150);
    }
    rect(width/2 - btnW/2, height/3 + i*100, btnW, btnH, 5);
    fill(0);
    text(levels[i], width / 2, height / 3 + i*100 + btnH/2);
  }
}

function playGame() {
  // 繪製彎曲牆壁
  drawWalls();

  let { startPos, endPos } = getStartEndPos();
  fill(0, 255, 0, 100);
  ellipse(startPos.x, startPos.y, startPos.size);
  fill(255, 0, 0, 100);
  ellipse(endPos.x, endPos.y, endPos.size);
  fill(255);
  textSize(16);
  text("起點", startPos.x, startPos.y);
  text("終點", endPos.x, endPos.y);

  // 碰撞偵測 (偵測滑鼠位置的顏色)
  let c = get(mouseX, mouseY);
  // 同時偵測牆壁顏色與障礙物顏色
  let isWall = red(c) === wallColor[0] && green(c) === wallColor[1] && blue(c) === wallColor[2];
  let isHazard = red(c) === hazardColor[0] && green(c) === hazardColor[1] && blue(c) === hazardColor[2];
  if (isWall || isHazard) {
    gameState = 'GAMEOVER';
  }

  // 邊界檢查
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    gameState = 'GAMEOVER';
  }

  // 勝利檢查
  if (dist(mouseX, mouseY, endPos.x, endPos.y) < endPos.size / 2) {
    gameState = 'WIN';
  }
}

function drawWaiting() {
  drawWalls();
  let { startPos, endPos } = getStartEndPos();
  
  fill(0, 255, 0, 200); // 起點加深顏色提示
  ellipse(startPos.x, startPos.y, startPos.size);
  fill(255, 0, 0, 100);
  ellipse(endPos.x, endPos.y, endPos.size);
  
  fill(255);
  textSize(24);
  text("請在綠色起點點擊滑鼠開始遊戲", width / 2, 50);
  textSize(16);
  text("起點", startPos.x, startPos.y);
  text("終點", endPos.x, endPos.y);
}

function getStartEndPos() {
  return {
    startPos: {x: 40, y: (pathTop[0].y + pathBottom[0].y) / 2, size: 60},
    // 將終點改為動態抓取最後一個點的位置
    endPos: {x: width - 40, y: (pathTop[pathTop.length - 1].y + pathBottom[pathBottom.length - 1].y) / 2, size: 60}
  };
}

function drawWalls() {
  fill(wallColor);
  noStroke();
  
  // 根據難度設定晃動幅度 (簡單: 5px, 中等: 10px, 困難: 20px)
  let shakeAmount = difficulty * 7;
  let shakeSpeed = 0.02; // 波動的速度

  // 用來儲存這一幀計算出的動態點座標，以便稍後繪製霓虹邊緣
  let currentTopPoints = [];
  let currentBottomPoints = [];

  // 1. 先計算這一幀所有點的動態位置 (包含雜訊位移)
  for (let i = 0; i < pathTop.length; i++) {
    let offsetYTop = (noise(frameCount * shakeSpeed, i * 100) - 0.5) * shakeAmount;
    currentTopPoints.push({ x: pathTop[i].x, y: pathTop[i].y + offsetYTop });

    let offsetYBottom = (noise(frameCount * shakeSpeed, i * 100 + 500) - 0.5) * shakeAmount;
    currentBottomPoints.push({ x: pathBottom[i].x, y: pathBottom[i].y + offsetYBottom });
  }

  // 2. 繪製實心牆壁區域 (用於顏色碰撞偵測)
  fill(wallColor);
  noStroke();

  // 上方牆壁
  beginShape();
  vertex(0, 0);
  // curveVertex 需要重複起點與終點作為控制點
  curveVertex(currentTopPoints[0].x, currentTopPoints[0].y); 
  for (let p of currentTopPoints) curveVertex(p.x, p.y);
  curveVertex(currentTopPoints[currentTopPoints.length - 1].x, currentTopPoints[currentTopPoints.length - 1].y);
  vertex(width, 0);
  endShape(CLOSE);

  // 下方牆壁
  beginShape();
  vertex(0, height);
  curveVertex(currentBottomPoints[0].x, currentBottomPoints[0].y);
  for (let p of currentBottomPoints) curveVertex(p.x, p.y);
  curveVertex(currentBottomPoints[currentBottomPoints.length - 1].x, currentBottomPoints[currentBottomPoints.length - 1].y);
  vertex(width, height);
  endShape(CLOSE);

  // 3. 繪製霓虹發光邊緣
  push();
  noFill();
  strokeWeight(3);
  stroke(0, 255, 255); // 霓虹青色
  
  // 設定 Canvas 原生發光效果
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(0, 255, 255);

  // 繪製上方邊緣線
  beginShape();
  curveVertex(currentTopPoints[0].x, currentTopPoints[0].y);
  for (let p of currentTopPoints) curveVertex(p.x, p.y);
  curveVertex(currentTopPoints[currentTopPoints.length - 1].x, currentTopPoints[currentTopPoints.length - 1].y);
  endShape();

  // 繪製下方邊緣線
  beginShape();
  curveVertex(currentBottomPoints[0].x, currentBottomPoints[0].y);
  for (let p of currentBottomPoints) curveVertex(p.x, p.y);
  curveVertex(currentBottomPoints[currentBottomPoints.length - 1].x, currentBottomPoints[currentBottomPoints.length - 1].y);
  endShape();
  
  pop(); // 恢復繪製狀態，避免影響其他元件
  
  // 困難模式額外干擾：在路徑中間隨機放一個小障礙物 (可選)
  if (difficulty === 3) {
    push();
    fill(hazardColor);
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = color(hazardColor);
    
    // 修正：使用這一幀計算出的「動態座標」來定位障礙物
    let midIdx = floor(currentTopPoints.length / 2);
    let hx = currentTopPoints[midIdx].x;
    let hy = (currentTopPoints[midIdx].y + currentBottomPoints[midIdx].y) / 2;
    ellipse(hx, hy, 20); 
    pop();
  }
  
  noStroke();
}

function updateParticles() {
  // 只有在遊戲進行中或等待開始時產生新粒子
  if (gameState === 'PLAYING' || gameState === 'WAITING_TO_START') {
    particles.push(new Particle(mouseX, mouseY));
  }

  // 倒序遍歷陣列以便安全刪除已消失的粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

// 粒子類別定義
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-0.8, 0.8); // 輕微的隨機飄移
    this.vy = random(-0.8, 0.8);
    this.alpha = 255;            // 透明度
    this.size = random(8, 15);   // 初始大小
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 7;             // 消失速度
    this.size *= 0.96;           // 逐漸縮小
  }
  show() {
    noStroke();
    // 外圈：較大且透明，營造發光暈染感
    fill(0, 150, 255, this.alpha * 0.3);
    ellipse(this.x, this.y, this.size * 1.5);
    // 內圈：較小且明亮，作為發光核心
    fill(100, 220, 255, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
  isDead() {
    return this.alpha <= 0;
  }
}

function drawEndScreen(msg, col, subMsg) {
  fill(col);
  textSize(60);
  text(msg, width / 2, height / 2);
  fill(200, 230, 255);
  textSize(20);
  text(subMsg, width / 2, height / 2 + 80);
}

function mousePressed() {
  if (gameState === 'START') {
    gameState = 'LEVEL_SELECT';
  } 
  else if (gameState === 'LEVEL_SELECT') {
    let btnW = 200, btnH = 60;
    for (let i = 0; i < 3; i++) {
      if (mouseX > width/2 - btnW/2 && mouseX < width/2 + btnW/2 && 
          mouseY > height/3 + i*100 && mouseY < height/3 + i*100 + btnH) {
        difficulty = i + 1;
        initPath(); // 根據選擇的難度重新生成路徑
        gameState = 'WAITING_TO_START';
      }
    }
  }
  else if (gameState === 'WAITING_TO_START') {
    let { startPos } = getStartEndPos();
    // 檢查是否在起點範圍內點擊
    if (dist(mouseX, mouseY, startPos.x, startPos.y) < startPos.size / 2) {
      gameState = 'PLAYING';
    }
  }
  else if (gameState === 'WIN') {
    if (difficulty < 3) {
      difficulty++;    // 增加難度
      initPath();      // 重新生成更複雜的路徑
      gameState = 'WAITING_TO_START'; // 進入下一關的準備狀態
    } else {
      gameState = 'START'; // 全部破關，回主選單
    }
  }
  else if (gameState === 'GAMEOVER') {
    gameState = 'START';
  }
}

function checkRectCollision(x, y, w, h) {
  return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
}
