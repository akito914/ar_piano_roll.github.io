

class MousePointing{

    constructor(range_r) {
        this.rng_r = range_r;
        
        this.cx = new Array();;
        this.cy = new Array();;
        this.m_pressing = false;
        this.pt_num = 0;
        this.selectedItem = 0;
    }

    addPoint(x, y) {
        this.cx.push(x);
        this.cy.push(y);
        this.pt_num ++;
    }

    mPressed(mx, my) {
        for(let i = 0; i < this.pt_num; i++)
        {
            if(sqrt((mx - this.cx[i])**2 + (my - this.cy[i])**2) < this.rng_r)
            {

                this.cx[i] = mx;
                this.cy[i] = my;

                this.m_pressing = true;
                this.selectedItem = i;
                break;
            }
        }
    }

    mReleased(mx, my) {
        if(this.m_pressing)
        {
            this.m_pressing = false;
        }
    }

    refresh(mx, my) {
        if(this.m_pressing)
        {
            this.cx[this.selectedItem] = mx;
            this.cy[this.selectedItem] = my;
        }
    }

}




