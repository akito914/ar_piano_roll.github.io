

let cap;
let cap_started = false;
let camSelect;
let frame_counter = 0;
const devices = [];

let mousePt;
let coorTrans;

function setup() {

    createCanvas(1920, 1080);


    mousePt = new MousePointing(10);
    // mousePt.addPoint(100, 100);
    // mousePt.addPoint(100, 200);
    // mousePt.addPoint(200, 200);
    // mousePt.addPoint(200, 100);
    mousePt.addPoint(497, 724);
    mousePt.addPoint(564, 808);
    mousePt.addPoint(1519, 472);
    mousePt.addPoint(1413, 442);
    //console.log(mousePt);


    coorTrans = new CamCoordTrans();
    coorTrans.updateTrans();

    matrixTest();
    
    navigator.mediaDevices.enumerateDevices().then(gotDevices);

}

function keyPressed() {
    if(key == ' ') {
        let fs = fullscreen();
        fullscreen(!fs);
    }
    if(key == 'l') {
      console.log(mousePt);
    }
}

function mousePressed() {

    mousePt.mPressed(mouseX, mouseY);

}

function mouseReleased() {
    
    mousePt.mReleased(mouseX, mouseY);

}

// function windowResized() {
// // print("ウィンドウサイズの変更");
//     resizeCanvas(windowWidth, windowHeight);
// }

function gotDevices(deviceInfos) {
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    if (deviceInfo.kind == 'videoinput') {
      devices.push({
        label: deviceInfo.label,
        id: deviceInfo.deviceId
      });
    }
  }
  //console.log(devices);
  
  camSelect = createSelect();
  camSelect.position(10, 10);
  for (let i = 0; i < devices.length; i++) {
        camSelect.option(devices[i].label, i);
  }
  camSelect.changed(camSelectChanged);
  
  var constraints = {
    video: {
      deviceId: {
        exact: devices[1].id
      },
      width: 1920,
      height: 1080,
      frameRate: 30
    }
  };
  cap = createCapture(constraints);
  cap.hide();
  cap_started = true;

}


function camSelectChanged() {
    
    cap_started = false;
    cap.remove();
    
    var constraints = {
        video: {
          deviceId: {
            exact: devices[camSelect.value()].id
          },
          width: 1920,
          height: 1080
        }
      };
    cap = createCapture(constraints);
    cap.hide();

    cap_started = true;
}


function draw() {

    background(100, 150, 100);


    if(cap_started)
    {
        let img = cap.get();
        image(img, 0, 0);

        frame_counter++;
    }

    mousePt.refresh(mouseX, mouseY);
    for(let i = 0; i < mousePt.pt_num; i++)
    {
        noFill();
        stroke(0, 255, 0);
        strokeWeight(1);
        ellipse(mousePt.cx[i], mousePt.cy[i], mousePt.rng_r, mousePt.rng_r);
        text(String(i+1), mousePt.cx[i]+10, mousePt.cy[i]+10);
        coorTrans.setCornerPoint(i, mousePt.cx[i], mousePt.cy[i])
    }

    coorTrans.updateTrans();
    let p10 = coorTrans.world2img(0,0,0);
    let p20 = coorTrans.world2img(0,148,0);
    let p30 = coorTrans.world2img(1225,148,0);
    let p40 = coorTrans.world2img(1225,0,0);
    let z = 100;
    let p11 = coorTrans.world2img(0,0,z);
    let p21 = coorTrans.world2img(0,148,z);
    let p31 = coorTrans.world2img(1225,148,z);
    let p41 = coorTrans.world2img(1225,0,z);
    stroke(255, 0, 0);
    strokeWeight(4);
    line(p10[0], p10[1], p11[0], p11[1]);
    line(p20[0], p20[1], p21[0], p21[1]);
    line(p30[0], p30[1], p31[0], p31[1]);
    line(p40[0], p40[1], p41[0], p41[1]);
    
    textSize(18);
    strokeWeight(1);
    text(nf(coorTrans.dFOV, 2, 1), 100, 100);

}
