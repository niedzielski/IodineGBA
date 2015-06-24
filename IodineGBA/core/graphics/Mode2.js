"use strict";
/*
 Copyright (C) 2012-2015 Grant Galitz
 
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function GameBoyAdvanceMode2Renderer(gfx) {
    this.gfx = gfx;
}
GameBoyAdvanceMode2Renderer.prototype.initialize = function () {
    this.lineBuffer = this.gfx.lineBuffer;
    this.bg2MatrixRenderer = this.gfx.bg2MatrixRenderer;
    this.bg3MatrixRenderer = this.gfx.bg3MatrixRenderer;
    this.objRenderer = this.gfx.objRenderer;
    this.objWindowRenderer = this.gfx.objWindowRenderer;
    this.window1Renderer = this.gfx.window1Renderer;
    this.window0Renderer = this.gfx.window0Renderer;
}
GameBoyAdvanceMode2Renderer.prototype.renderScanLine = function (line) {
    line = line | 0;
    var BG2Buffer = null;
    var BG3Buffer = null;
    var OBJBuffer = null;
    if ((this.gfx.display & 0x4) != 0) {
        BG2Buffer = this.bg2MatrixRenderer.renderScanLine(line | 0);
    }
    if ((this.gfx.display & 0x8) != 0) {
        BG3Buffer = this.bg3MatrixRenderer.renderScanLine(line | 0);
    }
    if ((this.gfx.display & 0x10) != 0) {
        OBJBuffer = this.objRenderer.renderScanLine(line | 0);
    }
    this.gfx.compositeLayers(OBJBuffer, null, null, BG2Buffer, BG3Buffer);
    if ((this.gfx.display & 0x80) != 0) {
        this.objWindowRenderer.renderScanLine(line | 0, this.lineBuffer, OBJBuffer, null, null, BG2Buffer, BG3Buffer);
    }
    if ((this.gfx.display & 0x40) != 0) {
        this.window1Renderer.renderScanLine(line | 0, this.lineBuffer, OBJBuffer, null, null, BG2Buffer, BG3Buffer);
    }
    if ((this.gfx.display & 0x20) != 0) {
        this.window0Renderer.renderScanLine(line | 0, this.lineBuffer, OBJBuffer, null, null, BG2Buffer, BG3Buffer);
    }
    this.gfx.copyLineToFrameBuffer(line | 0);
}