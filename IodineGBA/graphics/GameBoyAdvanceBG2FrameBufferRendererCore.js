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
	if (x > 239 || y > 159) {
		return this.transparency;
	}
	var address = (y * 480) + (x << 1);
	return ((this.VRAM[address | 1] << 8) | this.VRAM[address]) & 0x7FFF;
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.fetchMode3PixelOptimized = function (x, y) {
	//Output pixel:
	if (x > 239 || y > 159) {
		return this.transparency;
	}
	var address = (y * 240) + x;
	return this.VRAM16[address] & 0x7FFF;
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.fetchMode4Pixel = function (x, y) {
    //Output pixel:
	if (x > 239 || y > 159) {
        return this.transparency;
	}
	return this.palette[this.VRAM[this.frameSelect + (y * 240) + x]];
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.fetchMode5Pixel = function (x, y) {
	//Output pixel:
	if (x > 159 || y > 127) {
		return this.transparency;
	}
	var address = this.frameSelect + (y * 480) + (x << 1);
	return ((this.VRAM[address | 1] << 8) | this.VRAM[address]) & 0x7FFF;
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.fetchMode5PixelOptimized = function (x, y) {
	//Output pixel:
	if (x > 159 || y > 127) {
		return this.transparency;
	}
	var address = this.frameSelect + (y * 240) + x;
	return this.VRAM16[address] & 0x7FFF;
}
GameBoyAdvanceBG2FrameBufferRenderer.prototype.writeFrameSelect = function (frameSelect) {
    this.frameSelect = frameSelect * 0xA000;
}