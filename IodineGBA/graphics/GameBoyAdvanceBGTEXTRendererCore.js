"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012 Grant Galitz
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
function GameBoyAdvanceBGTEXTRenderer(gfx, BGLayer) {
	this.gfx = gfx;
    this.BGLayer = BGLayer;
	this.initialize();
}
GameBoyAdvanceBGTEXTRenderer.prototype.initialize = function (line) {
	this.scratchBuffer = getInt32Array(248);
	this.BGXCoord = 0;
	this.BGYCoord = 0;
    this.preprocess();
    this.priorityPreprocess();
}
GameBoyAdvanceBGTEXTRenderer.prototype.renderScanLine = function (line) {
	if (this.gfx.BGMosaic[this.BGLayer]) {
		//Correct line number for mosaic:
		line -= this.gfx.mosaicRenderer.getMosaicYOffset(line);
	}
	var yTileOffset = (line + this.BGYCoord) & 0x7;
	var pixelPipelinePosition = this.BGXCoord & 0x7;
    var yTileStart = (line + this.BGYCoord) >> 3;
    var xTileStart = this.BGXCoord >> 3;
	for (var position = 0; position < 240;) {
		var chrData = this.fetchTile(yTileStart, xTileStart++);
		while (pixelPipelinePosition < 0x8) {
			this.scratchBuffer[position++] = this.priorityFlag | this.fetchVRAM(chrData, pixelPipelinePosition++, yTileOffset);
		}
		pixelPipelinePosition &= 0x7;
	}
	if (this.gfx.BGMosaic[this.BGLayer]) {
		//Pixelize the line horizontally:
		this.gfx.mosaicRenderer.renderMosaicHorizontal(this.scratchBuffer);
	}
	return this.scratchBuffer;
}
GameBoyAdvanceBGTEXTRenderer.prototype.fetchTile = function (yTileStart, xTileStart) {
	//Find the tile code to locate the tile block:
	var address = this.computeScreenMapAddress(this.computeTileNumber(yTileStart, xTileStart));
	return (this.gfx.VRAM[address | 1] << 8) | this.gfx.VRAM[address];
}
GameBoyAdvanceBGTEXTRenderer.prototype.computeTileNumber = function (yTile, xTile) {
	//Return the true tile number:
    return (((yTile & this.tileHeight) << 5) + ((xTile & this.tileWidth) << 5)) | (xTile & 0x1F);
}
GameBoyAdvanceBGTEXTRenderer.prototype.computeScreenMapAddress = function (tileNumber) {
	return ((tileNumber << 1) | (this.gfx.BGScreenBaseBlock[this.BGLayer] << 11)) & 0xFFFF;
}
GameBoyAdvanceBGTEXTRenderer.prototype.fetch4BitVRAM = function (chrData, xOffset, yOffset) {
	//Parse flip attributes, grab palette, and then output pixel:
	var address = (chrData & 0x3FF) << 5;
	address += this.baseBlockOffset;
	address += (((chrData & 0x800) == 0x800) ? (0x7 - yOffset) : yOffset) << 2;
	address += (((chrData & 0x400) == 0x400) ? (0x7 - xOffset) : xOffset) >> 1;
	if ((xOffset & 0x1) == ((chrData & 0x400) >> 10)) {
		return this.palette[chrData >> 12][this.gfx.VRAM[address] & 0xF];
	}
	return this.palette[chrData >> 12][this.gfx.VRAM[address] >> 4];
}
GameBoyAdvanceBGTEXTRenderer.prototype.fetch8BitVRAM = function (chrData, xOffset, yOffset) {
	//Parse flip attributes and output pixel:
	var address = (chrData & 0x3FF) << 6;
	address += this.baseBlockOffset;
	address += (((chrData & 0x800) == 0x800) ? (0x7 - yOffset) : yOffset) << 3;
	address += ((chrData & 0x400) == 0x400) ? (0x7 - xOffset) : xOffset;
	return this.palette[this.gfx.VRAM[address]];
}
GameBoyAdvanceBGTEXTRenderer.prototype.preprocess = function () {
	if (this.gfx.BGPalette256[this.BGLayer]) {
		this.palette = this.gfx.palette256;
		this.fetchVRAM = this.fetch8BitVRAM;
	}
	else {
		this.palette = this.gfx.palette16;
		this.fetchVRAM = this.fetch4BitVRAM;
	}
    this.tileWidth = (this.gfx.BGScreenSize[this.BGLayer] & 0x1) << 0x5;
    this.tileHeight = (0x20 << ((this.gfx.BGScreenSize[this.BGLayer] & 0x2) - 1)) - 1;
	this.baseBlockOffset = this.gfx.BGCharacterBaseBlock[this.BGLayer] << 14;
}
GameBoyAdvanceBGTEXTRenderer.prototype.priorityPreprocess = function () {
	this.priorityFlag = (this.gfx.BGPriority[this.BGLayer] << 23) | (1 << (this.BGLayer + 0x10));
}
GameBoyAdvanceBGTEXTRenderer.prototype.writeBGHOFS0 = function (data) {
	this.BGXCoord = (this.BGXCoord & 0x100) | data;
}
GameBoyAdvanceBGTEXTRenderer.prototype.writeBGHOFS1 = function (data) {
	this.BGXCoord = ((data & 0x01) << 8) | (this.BGXCoord & 0xFF);
}
GameBoyAdvanceBGTEXTRenderer.prototype.writeBGVOFS0 = function (data) {
	this.BGYCoord = (this.BGYCoord & 0x100) | data;
}
GameBoyAdvanceBGTEXTRenderer.prototype.writeBGVOFS1 = function (data) {
	this.BGYCoord = ((data & 0x01) << 8) | (this.BGYCoord & 0xFF);
}