

let cap;
let cap_started = false;
let camSelect;
let frame_counter = 0;
const devices = [];

let mousePt;
let coorTrans;

let midi;
let midiSelect;

let pianoRoll;

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

    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

    pianoRoll = new PianoRoll(drawOneNote, drawNoteShadow);


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

function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess;

  midiSelect = createSelect();
  midiSelect.position(10, 50);
  for (const entry of midiAccess.inputs) {
    const input = entry[1];

    midiSelect.option(input.name, input.id);

    // console.log(input);
    
    // console.log(
    //   `Input port [type:'${input.type}'] id:'${input.id}' manufacturer: '${input.manufacturer}' name: '${input.name}' version: '${input.version}'`
    // );
  }

  midiSelect.changed(midiSelectChanged);

  // console.log( midiAccess.inputs.get('input-0') );
  midiAccess.inputs.get('input-0').onmidimessage = onMIDIMessage;


}

function midiSelectChanged() {

  for (const entry of midi.inputs) {
    const input = entry[1];
    input.close();
  }

  let id = midiSelect.value();

  midi.inputs.get(id).onmidimessage = onMIDIMessage;

}


function onMIDIMessage(message) {
  const data = message.data;
  if(data.length == 3)
  {
    //console.log("MIDI data: ", data);
    if(data[0] == 0x90)
    {
      console.log("Note ON, Note: ", data[1], "Velocity: ", data[2]);
      pianoRoll.noteOn(data[1], data[2]);
    }
    else if(data[0] == 0x80)
    {
      console.log("Note OFF, Note: ", data[1]);
      pianoRoll.noteOff(data[1], data[2]);
    }
  }
}


function onMIDIFailure(msg) {
  console.error(`Failed to get MIDI access - ${msg}`);
}


function drawOneNote(noteNum, startTime, endTime, velocity)
{
    let pianoroll_width = 1225;
    let pianoroll_height = 1000;
    let mmPerMs = 0.1;

    let x0 = pianoroll_width * (noteNum - 21) / 88.0;
    let x1 = pianoroll_width * (noteNum - 20) / 88.0;
    let r0 = startTime * mmPerMs;
    let r1 = endTime * mmPerMs;

    let tilt = 75 / 180.0 * Math.PI;
    let pxy = [
      [x0, r0],
      [x0, r1],
      [x1, r1],
      [x1, r0],
    ];

    let p = [];
    for(let i = 0; i < 4; i++)
    {
      p[i] = coorTrans.world2img(pxy[i][0], pxy[i][1]*Math.cos(tilt), -pxy[i][1]*Math.sin(tilt));
      if(p[i] == null)
      {
        return;
      }
    }

    noStroke();
    fill(0, 255, 255);
    quad(p[0][0], p[0][1], p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
    
}

function drawNoteShadow(noteNum, velocity)
{

  let pianoroll_width = 1225;
  let pianoroll_height = 1000;
  let mmPerMs = 0.1;

  let x0 = pianoroll_width * (noteNum - 20.5) / 88.0;
  
  stroke(255, 255, 255);
  noFill();
  strokeWeight(2);
  beginShape();
  for(let theta = 0; theta < 2*Math.PI; theta += 2*Math.PI/16)
  {
    let dx = 20*Math.cos(theta);
    let dy = 20*Math.sin(theta);
    p = coorTrans.world2img(x0+dx,0+dy,0);
    vertex(p[0], p[1]);
  }
  endShape(CLOSE);

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

    stroke(0, 255, 255);
    strokeWeight(1);
    for(let i = 0; i <= 52; i++)
    {
      let x = 1225/52*i;
      let p0 = coorTrans.world2img(x,0,0);
      let p1 = coorTrans.world2img(x,148,0);
      line(p0[0], p0[1], p1[0], p1[1]);
    }

    // textSize(18);
    // strokeWeight(1);
    // text(nf(coorTrans.dFOV, 2, 1), 100, 100);

    pianoRoll.drawNotes();

}


