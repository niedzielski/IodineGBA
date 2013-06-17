"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2013 Grant Galitz
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 * The full license is available at http://www.gnu.org/licenses/gpl.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 */
function GameBoyAdvanceBG2FrameBufferRenderer(gfx) {
	this.gfx = gfx;
    this.transparency = this.gfx.transparency;
    this.palette = this.gfx.palette256;
    this.VRAM = this.gfx.VRAM;
    this.VRAM16 = this.gfx.VRAM16;
    this.fetchPixel = this.fetchMode3Pixel;
	this.bgAffineRenderer = this.gfx.bgAffineRenderer[0];
    this.frameSelect = 0;
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.selectMode = function (mode) {
	switch (mode) {
		case 3:
			this.fetchPixel = (this.VRAM16) ? this.fetchMode3PixelOptimized : this.fetchMode3Pixel;
			break;
		case 4:
			this.fetchPixel = this.fetchMode4Pixel;
			break;
		case 5:
			this.fetchPixel = (this.VRAM16) ? this.fetchMode5PixelOptimized : this.fetchMode5Pixel;
	}
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.renderScanLine = function (line) {
	return this.bgAffineRenderer.renderScanLine(line, this);
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.fetchMode3Pixel = function (x, y) {
    //Output pixel:
	if (x < 240 && y < 160) {
        var address = ((y * 240) + x) << 1;
        return ((this.VRAM[address | 1] << 8) | this.VRAM[address]) & 0x7FFF;
    }
    //Out of range, output transparency:
    return this.transparency;
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.fetchMode3PixelOptimized = function (x, y) {
    //Tell JS Engines it's int32:
    x = x | 0;
    y = y | 0;
    //Output pixel:
	if (x < 240 && y < 160) {
        var address = ((y * 240) + x) | 0;
        return this.VRAM16[address | 0] & 0x7FFF;
    }
    //Out of range, output transparency:
    return this.transparency | 0;
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.fetchMode4Pixel = function (x, y) {
    //Tell JS Engines it's int32:
    x = x | 0;
    y = y | 0;
    //Output pixel:
	if (x < 240 && y < 160) {
        var frameSelect = this.frameSelect | 0;
        var address = (this.frameSelect + (y * 240) + x) | 0;
        return this.palette[this.VRAM[address | 0] | 0] | 0;
    }
    //Out of range, output transparency:
    return this.transparency | 0;
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.fetchMode5Pixel = function (x, y) {
    //Output pixel:
	if (x < 160 && y < 128) {
        var address = this.frameSelect + (((y * 240) + x) << 1);
        return ((this.VRAM[address | 1] << 8) | this.VRAM[address]) & 0x7FFF;
    }
    //Out of range, output transparency:
    return this.transparency;
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.fetchMode5PixelOptimized = function (x, y) {
    //Tell JS Engines it's int32:
    x = x | 0;
    y = y | 0;
    //Output pixel:
	if (x < 160 && y < 128) {
        var frameSelect = this.frameSelect | 0;
        var address = (frameSelect + (y * 240) + x) | 0;
        return this.VRAM16[address | 0] & 0x7FFF;
    }
    //Out of range, output transparency:
    return this.transparency | 0;
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.writeFrameSelect = function (frameSelect) {
    this.frameSelect = frameSelect * 0xA000;
}