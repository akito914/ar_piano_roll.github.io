

let cap;
let cap_started = false;
let camSelect;
let frame_counter = 0;
const devices = [];

let mousePt;

function setup() {

    createCanvas(1920, 1080);


    mousePt = new MousePointing(10);
    mousePt.addPoint(100, 100);
    mousePt.addPoint(100, 200);
    mousePt.addPoint(200, 200);
    mousePt.addPoint(200, 100);

    console.log(mousePt);
    
    navigator.mediaDevices.enumerateDevices().then(gotDevices);

}

function keyPressed() {
    if(key == ' ') {
        let fs = fullscreen();
        fullscreen(!fs);
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
  console.log(devices);
  
  camSelect = createSelect();
  camSelect.position(10, 10);
  for (let i = 0; i < devices.length; i++) {
        camSelect.option(devices[i].label, i);
  }
  camSelect.changed(camSelectChanged);
  
  var constraints = {
    video: {
      deviceId: {
        exact: devices[0].id
      },
      width: 1920,
      height: 1080
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
        ellipse(mousePt.cx[i], mousePt.cy[i], mousePt.rng_r, mousePt.rng_r);
        text(String(i+1), mousePt.cx[i]+10, mousePt.cy[i]+10);
    }

}
