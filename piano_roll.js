

class PianoRoll{

    constructor(func_drawrect, func_drawshadow) {

        this.roll_x_min = 100;
        this.roll_x_max = 1800;
        this.roll_y_min = 200;
        this.roll_y_max = 900;

        this.note_array = new Array(128).fill(0);

        this.notebuf_length = 512;

        this.notebuf_time = new Array(this.notebuf_length);
        this.notebuf_notenum = new Array(this.notebuf_length);
        this.notebuf_velocity = new Array(this.notebuf_length);
        this.notebuf_cursor = 0;

        this.sustain_hold = new Array(128).fill(false);
        this.sustain_state = false;

        for(let i = 0; i < this.notebuf_length; i++)
        {
            this.notebuf_time[i] = -1;
            this.notebuf_notenum[i] = 128;
            this.notebuf_velocity[i] = 0;
        }

        // Callback functions
        this.drawNoteShadow = func_drawshadow;
        this.drawOneNote = func_drawrect;

    }

    noteOn(note, velocity) {
        
        this.note_array[note] = velocity;

        if(note >= 0 && note < 128)
        {
            if(this.sustain_hold[note])
            {
                this.notebuf_time[this.notebuf_cursor] = millis()-20;
                this.notebuf_notenum[this.notebuf_cursor] = note;
                this.notebuf_velocity[this.notebuf_cursor] = 0;
                this.notebuf_cursor += 1;
                if(this.notebuf_cursor >= this.notebuf_length) this.notebuf_cursor = 0;
                
                this.sustain_hold[note] = false;
            }

            this.notebuf_time[this.notebuf_cursor] = millis();
            this.notebuf_notenum[this.notebuf_cursor] = note;
            this.notebuf_velocity[this.notebuf_cursor] = velocity;
            this.notebuf_cursor += 1;
            if(this.notebuf_cursor >= this.notebuf_length) this.notebuf_cursor = 0;
        }
    }

    noteOff(note, velocity) {
        
        this.note_array[note] = 0;

        if(this.sustain_state)
        {
            this.sustain_hold[note] = true;
            return;
        }
        if(note >= 0 && note < 128)
        {
            this.notebuf_time[this.notebuf_cursor] = millis();
            this.notebuf_notenum[this.notebuf_cursor] = note;
            this.notebuf_velocity[this.notebuf_cursor] = 0;
            this.notebuf_cursor += 1;
            if(this.notebuf_cursor >= this.notebuf_length) this.notebuf_cursor = 0;
        }
    }

    sustain(velocity) {
        if(velocity > 64)
        {
            this.sustain_state = true;
        }
        else
        {
            if(this.sustain_state == true)
            {
                for(let note = 0; note < 128; note++)
                {
                    if(this.sustain_hold[note])
                    {
                        this.notebuf_time[this.notebuf_cursor] = millis();
                        this.notebuf_notenum[this.notebuf_cursor] = note;
                        this.notebuf_velocity[this.notebuf_cursor] = 0;
                        this.notebuf_cursor += 1;
                        if(this.notebuf_cursor >= this.notebuf_length) this.notebuf_cursor = 0;

                        this.sustain_hold[note] = false;
                    }
                }
            }
            this.sustain_state = false;
        }
    }


    drawNotes() {

        let startPos = this.notebuf_cursor;
        let endPos = startPos - 1;
        if(endPos < 0) endPos = this.notebuf_length - 1;

        let prev_velocity = new Array(128).fill(0);
        let prev_time = new Array(128).fill(0);
        for(let i = 0; i < 128; i++)
        {
            if(this.note_array[i] > 0)
            {
                this.drawNoteShadow(i, this.note_array[i]);
            }
        }

        let cursor = startPos;
        while(true)
        {
            let noteNum = this.notebuf_notenum[cursor];
            let noteTime = this.notebuf_time[cursor];
            let velocity = this.notebuf_velocity[cursor];
            if(noteNum != 128)
            {
                if(this.notebuf_velocity[cursor] > 0)
                {
                    prev_velocity[noteNum] = velocity;
                    prev_time[noteNum] = noteTime;
                }
                else
                {
                    if(prev_velocity[noteNum] != 0)
                    { // note-onが昔過ぎる場合
                    //println("time=[" + prev_time[noteNum] + ", " +noteTime+ "], noteNum = " + noteNum + ", vel = "+ prev_velocity[noteNum]);
                        this.drawOneNote(noteNum, prev_time[noteNum] - millis(), noteTime - millis(), prev_velocity[noteNum]);
                    }

                    prev_velocity[noteNum] = 0;
                    prev_time[noteNum] = noteTime;
                }
            }
            if(cursor == endPos)
            {
                for(let i = 0; i < 128; i++)
                {
                    if(prev_velocity[i] != 0)
                    {
                        this.drawOneNote(i, prev_time[i] - millis(), 0, prev_velocity[i]);
                    }
                }
                break;
            }

            cursor++;
            if(cursor >= this.notebuf_length) cursor = 0;
        }
    
    }

    // drawNoteShadow(noteNum, velocity)
    // {
    //     let x0 = (this.roll_x_max - this.roll_x_min) * noteNum / 128.0 + this.roll_x_min;
    //     let w = (this.roll_x_max - this.roll_x_min) / 128.0;
    //     let y0 = this.roll_y_max;
    //     let y1 = this.roll_y_max;
    //     noStroke();
    //     stroke(255, 255, 255);
    //     noFill();
    //     //fill(0, 255, 255, 100);
    //     ellipse(x0 + w/2, y0, w*5, w*5);
    // }

    // drawOneNote(noteNum, startTime, endTime, velocity)
    // {
    //     let pixelPerMs = 0.1;
    //     noStroke();
    //     fill(0, 255, 255);
    //     let x0 = (this.roll_x_max - this.roll_x_min) * noteNum / 128.0 + this.roll_x_min;
    //     let w = (this.roll_x_max - this.roll_x_min) / 128.0;
    //     let y0 = this.roll_y_max + startTime * pixelPerMs;
    //     let y1 = this.roll_y_max + endTime * pixelPerMs;
    //     rect(x0, y0, w, y1 - y0);
    // }


}
