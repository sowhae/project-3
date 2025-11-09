function setup() {
  createCanvas(400, 400);
  angleMode(DEGREES)
}

class Star{
  constructor(color){
    this.color = color;
    this.x=0,
    this.y=0
    this.r=0
    this.s=1

  }
  draw(){
    stroke(this.color)

    push();

    translate (this.x, this.y)
    rotate(this.r)
    scale(this.s)
    translate(-200,-200)
    strokeWeight(1/this.s);

    beginShape();
    vertex(200,120);
    vertex(220,180);
    vertex(280,180);
    vertex(230,220);
    vertex(250,280);
    vertex(200,240);
    vertex(150,280);
    vertex(170,220);
    vertex(120,180);
    vertex(180,180);
    endShape(CLOSE);

    pop();
  }
}

let star1 = new Star('cyan')
  star1.x = 150;
  star1.y = 300;
  star1.r = 25;

let star2 = new Star('magenta')
  star2.x=250
  star2.y=100
  star2.s=0.5

let star3 = new Star('lime');
  star3.y=50;
  star3.x=200;

//array:
let stars = [];

function draw() {
  background(20);
  noFill();

  for (let s of stars){
    let originalRotation = s.r ;
    s.r += frameCount * 0.5;
    s.draw();
    s.r = originalRotation;
  }
}

function mouseClicked(){
  let newStar = new Star ('cyan');
  newStar.x= mouseX
  newStar.y= mouseY
  newStar.s = random(0.3,0.8)
  stars.push(newStar);
}
