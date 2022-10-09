



class CamCoordTrans{

    constructor() {

        this.piano_width = 1225;
        this.piano_height = 148;

        this.corners_world3d = new Matrix([
            [0, 0, this.piano_width, this.piano_width],
            [0, this.piano_height, this.piano_height, 0],
            [0, 0, 0, 0]], 3, 4
        );
        // console.log(this.corners_world3d);


        this.dFOV = 78;

        this.img_width = 1920;
        this.img_height = 1080;

        this.cx = this.img_width / 2;
        this.cy = this.img_height / 2;

        this.corners_img2d = new Matrix([
            [497, 564, 1519, 1413],
            [724, 808, 472, 442]
        ], 2, 4);

        
    }

    setCornerPoint(idx, x, y) {
        this.corners_img2d.mat[0][idx] = x;
        this.corners_img2d.mat[1][idx] = y;
    }

    updateTrans() {

        let diag = Math.sqrt(this.img_width * this.img_width + this.img_height * this.img_height);
        let tan_dFOV = Math.tan(this.dFOV / 180.0 * Math.PI / 2.0);
        this.f = diag / tan_dFOV / 2.0;

        let corners_cam3d = Matrix.zeros(3, 4);
        corners_cam3d.setMat(0, 0, Matrix.sub(this.corners_img2d.getRange(0,0,1,4), Matrix.ones(1,4).scalar(this.cx)));
        corners_cam3d.setMat(1, 0, Matrix.sub(this.corners_img2d.getRange(1,0,1,4), Matrix.ones(1,4).scalar(this.cy)));
        corners_cam3d.setMat(2, 0, Matrix.ones(1,4).scalar(this.f));
        corners_cam3d = Matrix.cath(corners_cam3d, corners_cam3d.getRange(0,0,3,1));
        // corners_cam3d.print();

        // 面の法線ベクトル
        let surf_norm = Matrix.zeros(3,4);
        for(let i = 0; i < 4; i++)
        {
            let crs = Matrix.cross(corners_cam3d.getRange(0,i,3,1), corners_cam3d.getRange(0,i+1,3,1)).normalize();
            surf_norm.setMat(0, i, crs);
        }
        // surf_norm.print();

        // 面の交線ベクトル
        let intersect_line = Matrix.zeros(3,2);
        intersect_line.setMat(0, 0, Matrix.cross(surf_norm.getRange(0,2,3,1), surf_norm.getRange(0,0,3,1)).normalize());
        intersect_line.setMat(0, 1, Matrix.cross(surf_norm.getRange(0,3,3,1), surf_norm.getRange(0,1,3,1)).normalize());
        // intersect_line.print();

        // 鍵盤の縦方向ベクトルと横方向ベクトルの偏角を表示
        let dothv = Matrix.dot(intersect_line.getRange(0,0,3,1), intersect_line.getRange(0,1,3,1));
        this.arghv = Math.acos(dothv) / Math.PI * 180.0;
        console.log(this.arghv);

        // 交線ベクトルの垂線ベクトル
        let piano_norm = Matrix.cross(intersect_line.getRange(0,0,3,1), intersect_line.getRange(0,1,3,1)).normalize();
        // piano_norm.print();

        // 鍵盤原点(左上の角)までの距離を計算
        let Aab = Matrix.zeros(3, 2);
        Aab.setMat(0,0, intersect_line.getRange(0,1,3,1).scalar(-1));
        Aab.setMat(0,1, corners_cam3d.getRange(0,3,3,1).normalize());
        let Bab = corners_cam3d.getRange(0,0,3,1).normalize();
        let ab = Matrix.mldivide(Aab, Bab);
        //ab.print();
        let L = Matrix.sub(this.corners_world3d.getRange(0,3,3,1), this.corners_world3d.getRange(0,0,3,1)).norm()/ab.at(0,0);
        // console.log(L);

        let piano_origin_cam3d = corners_cam3d.getRange(0,0,3,1).normalize().scalar(L);
        // piano_origin_cam3d.print();

        // ワールド座標での鍵盤角の相対位置ベクトル
        this.world_to_cam = Matrix.zeros(4,4);
        this.world_to_cam.setMat(0,0, intersect_line.getRange(0,1,3,1));
        this.world_to_cam.setMat(0,1, intersect_line.getRange(0,0,3,1));
        this.world_to_cam.setMat(0,2, piano_norm);
        this.world_to_cam.setMat(0,3, piano_origin_cam3d);
        this.world_to_cam.setMat(3,0, new Matrix([[0, 0, 0, 1]], 1, 4));
        // this.world_to_cam.mat[0][3] = piano_origin_cam3d.at(0,0)+this.cx;
        // this.world_to_cam.mat[1][3] = piano_origin_cam3d.at(1,0)+this.cy;
        // this.world_to_cam.mat[2][3] = piano_origin_cam3d.at(2,0);
        //this.world_to_cam.print();


    }

    world2img(X, Y, Z) {
        let vect_world4d = new Matrix([[X], [Y], [Z], [1]], 4, 1);
        let coord_img = Matrix.mul(this.world_to_cam, vect_world4d);
        coord_img = coord_img.scalar(this.f / coord_img.at(2,0));
        let ret = [coord_img.at(0,0) + this.cx, coord_img.at(1,0) + this.cy];
        return ret;
    }

    adaptiveFOV() {
        this.dFOV = this.dFOV + 0.01 * (this.arghv - 90);
    }


    
}



class Matrix{

    constructor(arr, rows, cols) {
        this.mat = [];
        for(let r = 0; r < rows; r++)
        {
            this.mat.push([]);
            for(let c = 0; c < cols; c++)
            {
                this.mat[r].push(arr[r][c]);
            }
        }
        this.rows = rows;
        this.cols = cols;
    }

    copy() {
        let mat = [...this.mat];
        return new Matrix(mat, this.rows, this.cols);
    }

    static zeros(rows, cols) {
        let arr = [];
        for(let r = 0; r < rows; r++)
        {
            arr.push([]);
            for(let c = 0; c < cols; c++)
            {
                arr[r].push(0);
            }
        }
        return new Matrix(arr, rows, cols);
    }

    static ones(rows, cols) {
        let arr = [];
        for(let r = 0; r < rows; r++)
        {
            arr.push([]);
            for(let c = 0; c < cols; c++)
            {
                arr[r].push(1);
            }
        }
        return new Matrix(arr, rows, cols);
    }

    static eye(rows) {
        let ret = Matrix.zeros(rows, rows);
        for(let r = 0; r < rows; r++)
        {
            ret.mat[r][r] = 1;
        }
        return ret;
    }

    at(r, c) {
        return this.mat[r][c];
    }

    getRange(r0, c0, rows, cols) {
        if(r0+rows > this.rows || c0+cols > this.cols)
        {
            console.error("[getRange] Invalid matrix size.");
            return;
        }
        let ret = Matrix.zeros(rows, cols);
        for(let r = 0; r < rows; r++)
        {
            for(let c = 0; c < cols; c++)
            {
                ret.mat[r][c] = this.at(r0+r, c0+c);
            }
        }
        return ret;
    }

    print() {
        console.log(this.mat);
    }

    static add(mat1, mat2) {
        if(mat1.rows !== mat2.rows || mat1.cols !== mat2.cols)
        {
            console.error("[add] Invalid matrix size.");
            return;
        }
        let ret = mat1;
        for(let r = 0; r < mat1.rows; r++)
        {
            for(let c = 0; c < mat1.cols; c++)
            {
                ret.mat[r][c] = mat1.at(r, c) + mat2.at(r, c);
            }
        }
        return ret;
    }

    static sub(mat1, mat2) {
        if(mat1.rows !== mat2.rows || mat1.cols !== mat2.cols)
        {
            console.error("[sub] Invalid matrix size.");
            return;
        }
        let ret = mat1;
        for(let r = 0; r < mat1.rows; r++)
        {
            for(let c = 0; c < mat1.cols; c++)
            {
                ret.mat[r][c] = mat1.at(r, c) - mat2.at(r, c);
            }
        }
        return ret;
    }

    static mul(mat1, mat2) {
        if(mat1.cols !== mat2.rows)
        {
            console.error("[mul] Invalid matrix size.");
            return;
        }
        let ret = Matrix.zeros(mat1.rows, mat2.cols);
        for(let r = 0; r < ret.rows; r++)
        {
            for(let c = 0; c < ret.cols; c++)
            {
                let sum = 0;
                for(let i = 0; i < mat1.cols; i++)
                {
                    sum = sum + mat1.at(r, i) * mat2.at(i, c);
                }
                ret.mat[r][c] = sum;
            }
        }
        return ret;
    }


    trans() {
        let ret = Matrix.zeros(this.cols, this.rows);
        for(let r = 0; r < ret.rows; r++)
        {
            for(let c = 0; c < ret.cols; c++)
            {
                ret.mat[r][c] = this.at(c, r);
            }
        }
        return ret;
    }

    scalar(k) {
        let ret = Matrix.zeros(this.rows, this.cols);
        for(let r = 0; r < ret.rows; r++)
        {
            for(let c = 0; c < ret.cols; c++)
            {
                ret.mat[r][c] = k * this.at(r, c);
            }
        }
        return ret;
    }

    norm() {
        if(this.cols !== 1)
        {
            console.error("[norm] Column must be 1.");
            return;
        }
        let sum = 0;
        for(let r = 0; r < this.rows; r++)
        {
            sum = sum + this.at(r, 0) * this.at(r, 0);
        }
        return Math.sqrt(sum);
    }

    normalize() {
        if(this.cols !== 1)
        {
            console.error("[normalize] Column must be 1.");
            return;
        }
        return this.scalar(1/this.norm());
    }

    static dot(v1, v2) {
        if(v1.rows !== v2.rows || v1.cols !== 1 || v2.cols !== 1)
        {
            console.error("[dot] Invalid vector size.");
            return;
        }
        let m = Matrix.mul(v1.trans(), v2);
        return m.at(0,0);
    }

    static cross(v1, v2) {
        if(v1.rows !== 3 || v2.rows !== 3 || v1.cols !== 1 || v2.cols !== 1)
        {
            console.error("[cross] Vector size must be 3x1.");
            return;
        }
        let ret = Matrix.zeros(3, 1);
        ret.mat[0][0] = v1.at(1, 0) * v2.at(2, 0) - v1.at(2, 0) * v2.at(1, 0);
        ret.mat[1][0] = v1.at(2, 0) * v2.at(0, 0) - v1.at(0, 0) * v2.at(2, 0);
        ret.mat[2][0] = v1.at(0, 0) * v2.at(1, 0) - v1.at(1, 0) * v2.at(0, 0);
        return ret;
    }

    luDecomp() {
        const EPS = Number.EPSILON;
        if(this.rows !== this.cols)
        {
            console.error("[luDecomp] Invalid matrix size.");
            return;
        }
        let n = this.rows;
        this.LU = this.copy();
        this.P = [];
        for(let k = 0; k < n; k++)
        {
            let a_max = Math.abs(this.LU.at(k, k));
            let ip = k;
            for(let i = k + 1; i < n; i++)
            {
                if(Math.abs(this.LU.at(i, k)) > a_max)
                {
                    a_max = Math.abs(this.LU.at(i, k));
                    ip = i;
                }
            }
            if(a_max <= EPS)
            {
                console.error("[luDecomp] Matrix is not regular.");
                return;
            }
            this.P.push(ip);
            if(ip !== k)
            {
                for(let j = k; j < n; j++)
                {
                    let temp = this.LU.at(k, j);
                    this.LU.mat[k][j] = this.LU.at(ip, j);
                    this.LU.mat[ip][j] = temp;
                }
            }
            for(let i = k + 1; i < n; i++)
            {
                let a = -1 * this.LU.at(i, k) / this.LU.at(k, k);
                this.LU.mat[i][k] = a;
                for(let j = k + 1; j < n; j++)
                {
                    this.LU.mat[i][j] = this.LU.at(i, j) + a * this.LU.at(k, j);
                }
            }
        }
    }

    static luDivide(A, B) {
        if(A.rows !== A.cols)
        {
            console.error("[luDivide] Invalid matrix size.");
            return;
        }
        A.luDecomp();
        let n = A.rows;
        let X = B.copy();
        for(let c = 0; c < X.cols; c++)
        {
            for(let k = 0; k < n; k++)
            {
                let temp = X.at(k, c);
                X.mat[k][c] = X.at(A.P[k], c);
                X.mat[A.P[k]][c] = temp;
                for(let i = k + 1; i < n; i++)
                {
                    X.mat[i][c] = X.mat[i][c] + A.LU.at(i, k) * X.at(k, c);
                }
            }
            for(let k = n-1; k >= 0; k--)
            {
                let sum = 0;
                for(let j = k + 1; j < n; j++)
                {
                    sum = sum + A.LU.at(k, j) * X.at(j, c);
                }
                X.mat[k][c] = (X.at(k,c) - sum) / A.LU.at(k,k);
            }
        }
        return X;
    }

    // A \ B
    static mldivide(A, B) {
        
        if(A.rows === A.cols)
        {
            if(A.rows !== B.rows)
            {
                console.error("[mldivide] Invalid vector size.");
                return;
            }
            return Matrix.luDivide(A, B);
        }
        else
        {
            if(A.rows !== B.rows)
            {
                console.error("[mldivide] Invalid matrix size.");
                return;
            }
            return Matrix.luDivide(Matrix.mul(A.trans(), A), Matrix.mul(A.trans(), B));
        }

    }

    static cath(m1, m2) {
        if(m1.rows !== m2.rows)
        {
            console.error("[cath] Invalid matrix size.");
            return;
        }
        let ret = m1.copy();
        for(let r = 0; r < m2.rows; r++)
        {
            for(let c = 0; c < m2.cols; c++)
            {
                ret.mat[r].push(m2.mat[r][c]);
            }
        }
        ret.cols = ret.cols + m2.cols;
        return ret;
    }

    static catv(m1, m2) {
        if(m1.cols !== m2.cols)
        {
            console.error("[catv] Invalid matrix size.");
            return;
        }
        let ret = m1.copy();
        for(let r = 0; r < m2.rows; r++)
        {
            ret.mat.push(m2.mat[r]);
        }
        ret.rows = ret.rows + m2.rows;
        return ret;
    }


    setMat(row, col, m) {
        if(row + m.rows > this.rows || col + m.cols > this.cols)
        {
            console.error("[setMat] Invalid matrix size.");
            return;
        }
        for(let r = 0; r < m.rows; r++)
        {
            for(let c = 0; c < m.cols; c++)
            {
                this.mat[row + r][col + c] = m.at(r, c);
            }
        }
    }



}



function matrixTest() {

    
    let m1 = new Matrix([[1,2,3], [5,4,3]], 2, 3);
    let m2 = new Matrix([[4,2], [4,3], [2,1]], 3, 2);
    
    let m3 = Matrix.mul(m1, m2);

    // m3.print();

    //Matrix.trans(m3).print();

    //Matrix.ones(3, 3).print();

    let v1 = new Matrix([[1], [2], [3]], 3, 1);
    let v2 = new Matrix([[2], [2], [2]], 3, 1);
    //console.log(v1);
    //v1.print();
    // console.log(v1.norm());
    // v1.normalize().print();
    //console.log(v1.normalize());

    // m1.getRange(0, 0, 2, 1).print();

    // v1.trans().print();
    // Matrix.dot(v1, v2).print();

    // Matrix.cross(v1, v2).print();

    // console.log(v1);

    // console.log(v1);
    // let clone = v1.copy();
    // clone.mat[0][0] = 1000;
    // console.log(clone);
    // console.log(v1);

    
    // let m4 = new Matrix([[4,2,3,1], [4,3,1, 1], [2,1,2,1], [3,2,1,5]], 4, 4);
    let m4 = new Matrix([[4,2,3,1], [4,3,1, 1], [2,1,2,1], [3,2,1,5], [1,2,1,1]], 5, 4);
    //let m4 = new Matrix([[4,2,3], [4,3,1], [2,1,2]], 3, 3);
    // m4.print();
    // m4.luDecomp();
    // m4.LU.print();
    // console.log(m4.P);

    // let mb = new Matrix([[4,1,3], [4,3,1], [2,2,1], [3,2,5]], 4, 3);
    let mb = new Matrix([[4,1,3], [4,3,1], [2,2,1], [3,2,5], [1,1,1]], 5, 3);
    // mb.print();

    // let X = Matrix.luDivide(m4, mb);
    // X.print();


    let A = new Matrix([[4,2], [1,3], [2,1]], 3, 2);
    let B = new Matrix([[4], [1], [5]], 3, 1);
    let X = Matrix.mldivide(A, B);
    // A.print();
    // B.print();
    // X.print();
    // Matrix.luDivide(Matrix.mul(A.trans(), A), Matrix.mul(A.trans(), B))

    // let C = A.trans();

    // console.log(C);

    // A.trans().print();
    // Matrix.mul(A.trans(), A).print();
    // Matrix.mul(A.trans(), B).print();
    
    
    // let M1 = new Matrix([[1,2,3], [5,4,3]], 2, 3);
    // let M2 = new Matrix([[11,12,13], [15,14,13]], 2, 3);

    // console.log(Matrix.cath(M1, M2));
    // console.log(Matrix.catv(M1, M2));

    // let T = Matrix.ones(5,5).scalar(2);
    // T.setMat(0, 0, Matrix.ones(2,3));
    // T.print();

}


