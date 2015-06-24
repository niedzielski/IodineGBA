"use strict";
/*
 Copyright (C) 2012-2015 Grant Galitz
 
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function GameBoyAdvanceMode1Renderer(gfx) {
    this.gfx = gfx;
}
GameBoyAdvanceMode1Renderer.prototype.initialize = function () {
    this.lineBuffer = this.gfx.lineBuffer;
    this.bg0Renderer = this.gfx.bg0Renderer;
    this.bg1Renderer = this.gfx.bg1Renderer;
    this.bg2MatrixRenderer = this.gfx.bg2MatrixRenderer;
    this.objRenderer = this.gfx.objRenderer;
    this.objWindowRenderer = this.gfx.objWindowRenderer;
    this.window1Renderer = this.gfx.window1Renderer;
    this.window0Renderer = this.gfx.window0Renderer;
}
GameBoyAdvanceMode1Renderer.prototype.renderScanLine = function (line) {
    line = line | 0;
    var BG0Buffer = null;
    var BG1Buffer = null;
    var BG2Buffer = null;
    var OBJBuffer = null;
    if ((this.gfx.display & 0x1) != 0) {
        BG0Buffer = this.bg0Renderer.renderScanLine(line | 0);
    }
    if ((this.gfx.display & 0x2) != 0) {
        BG1Buffer = this.bg1Renderer.renderScanLine(line | 0);
    }
    if ((this.gfx.display & 0x4) != 0) {
        BG2Buffer = this.bg2MatrixRenderer.renderScanLine(line | 0);
    }
    if ((this.gfx.display & 0x10) != 0) {
        OBJBuffer = this.objRenderer.renderScanLine(line | 0);
    }
    this.gfx.compositeLayers(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, null);
    if ((this.gfx.display & 0x80) != 0) {
        this.objWindowRenderer.renderScanLine(line | 0, this.lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, null);
    }
    if ((this.gfx.display & 0x40) != 0) {
        this.window1Renderer.renderScanLine(line | 0, this.lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, null);
    }
    if ((this.gfx.display & 0x20) != 0) {
        this.window0Renderer.renderScanLine(line | 0, this.lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, null);
    }
    this.gfx.copyLineToFrameBuffer(line | 0);
}
