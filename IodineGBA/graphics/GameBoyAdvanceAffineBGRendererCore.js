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
function GameBoyAdvanceAffineBGRenderer(gfx, BGLayer) {
	this.gfx = gfx;
    this.BGLayer = BGLayer;
	this.initialize();
}
GameBoyAdvanceAffineBGRenderer.prototype.initialize = function () {
	this.scratchBuffer = getInt32Array(240);
	this.BGdx = 0x100;
	this.BGdmx = 0;
	this.BGdy = 0;
	this.BGdmy = 0x100;
	this.actualBGdx = 0x1;
	this.actualBGdmx = 0;
	this.actualBGdy = 0;
	this.actualBGdmy = 0x1;
	this.BGReferenceX = 0;
	this.BGReferenceY = 0;
	this.actualBGReferenceX = 0;
	this.actualBGReferenceY = 0;
    this.pb = 0;
	this.pd = 0;
	this.priorityPreprocess();
}
GameBoyAdvanceAffineBGRenderer.prototype.renderScanLine = function (line, BGObject) {
    line = line | 0;
    var x = +this.pb;
    var y = +this.pd;
    if (this.gfx.BGMosaic[this.BGLayer]) {
		//Correct line number for mosaic:
		x -= this.actualBGdmx * this.gfx.mosaicRenderer.getMosaicYOffset(line);
		y -= this.actualBGdmy * this.gfx.mosaicRenderer.getMosaicYOffset(line);
	}
	for (var position = 0; position < 240; position = (position + 1) | 0, x += this.actualBGdx, y += this.actualBGdy) {
		//Fetch pixel:
		this.scratchBuffer[position] = this.priorityFlag | BGObject.fetchPixel(x | 0, y | 0);
	}
	if (this.gfx.BGMosaic[this.BGLayer]) {
		//Pixelize the line horizontally:
		this.gfx.mosaicRenderer.renderMosaicHorizontal(this.scratchBuffer);
	}
	this.incrementReferenceCounters();
	return this.scratchBuffer;
}
GameBoyAdvanceAffineBGRenderer.prototype.incrementReferenceCounters = function () {
	this.pb += this.actualBGdmx;
	this.pd += this.actualBGdmy;
}
GameBoyAdvanceAffineBGRenderer.prototype.resetReferenceCounters = function () {
	this.pb = this.actualBGReferenceX;
	this.pd = this.actualBGReferenceY;
}
GameBoyAdvanceAffineBGRenderer.prototype.priorityPreprocess = function () {
	this.priorityFlag = (this.gfx.BGPriority[this.BGLayer] << 23) | (1 << (this.BGLayer + 0x10));
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPA0 = function (data) {
	this.BGdx = (this.BGdx & 0xFF00) | data;
	this.actualBGdx = (this.BGdx << 16) / 0x1000000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPA1 = function (data) {
	this.BGdx = (data << 8) | (this.BGdx & 0xFF);
	this.actualBGdx = (this.BGdx << 16) / 0x1000000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPB0 = function (data) {
	this.BGdmx = (this.BGdmx & 0xFF00) | data;
	this.actualBGdmx = (this.BGdmx << 16) / 0x1000000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPB1 = function (data) {
	this.BGdmx = (data << 8) | (this.BGdmx & 0xFF);
	this.actualBGdmx = (this.BGdmx << 16) / 0x1000000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPC0 = function (data) {
	this.BGdy = (this.BGdy & 0xFF00) | data;
	this.actualBGdy = (this.BGdy << 16) / 0x1000000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPC1 = function (data) {
	this.BGdy = (data << 8) | (this.BGdy & 0xFF);
	this.actualBGdy = (this.BGdy << 16) / 0x1000000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPD0 = function (data) {
	this.BGdmy = (this.BGdmy & 0xFF00) | data;
	this.actualBGdmy = (this.BGdmy << 16) / 0x1000000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPD1 = function (data) {
	this.BGdmy = (data << 8) | (this.BGdmy & 0xFF);
	this.actualBGdmy = (this.BGdmy << 16) / 0x1000000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGX_L0 = function (data) {
	this.BGReferenceX = (this.BGReferenceX & 0xFFFFF00) | data;
	this.actualBGReferenceX = (this.BGReferenceX << 4) / 0x1000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGX_L1 = function (data) {
	this.BGReferenceX = (data << 8) | (this.BGReferenceX & 0xFFF00FF);
	this.actualBGReferenceX = (this.BGReferenceX << 4) / 0x1000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGX_H0 = function (data) {
	this.BGReferenceX = (data << 16) | (this.BGReferenceX & 0xF00FFFF);
	this.actualBGReferenceX = (this.BGReferenceX << 4) / 0x1000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGX_H1 = function (data) {
	this.BGReferenceX = ((data & 0xF) << 24) | (this.BGReferenceX & 0xFFFFFF);
	this.actualBGReferenceX = (this.BGReferenceX << 4) / 0x1000;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGY_L0 = function (data) {
	this.BGReferenceY = (this.BGReferenceY & 0xFFFFF00) | data;
	this.actualBGReferenceY = (this.BGReferenceY << 4) / 0x1000;
	this.resetReferenceCounters();
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGY_L1 = function (data) {
	this.BGReferenceY = (data << 8) | (this.BGReferenceY & 0xFFF00FF);
	this.actualBGReferenceY = (this.BGReferenceY << 4) / 0x1000;
    this.resetReferenceCounters();
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGY_H0 = function (data) {
	this.BGReferenceY = (data << 16) | (this.BGReferenceY & 0xF00FFFF);
	this.actualBGReferenceY = (this.BGReferenceY << 4) / 0x1000;
    this.resetReferenceCounters();
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGY_H1 = function (data) {
	this.BGReferenceY = ((data & 0xF) << 24) | (this.BGReferenceY & 0xFFFFFF);
	this.actualBGReferenceY = (this.BGReferenceY << 4) / 0x1000;
    this.resetReferenceCounters();
}