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
function GameBoyAdvanceOBJRenderer(gfx) {
	this.gfx = gfx;
	this.initialize();
}
GameBoyAdvanceOBJRenderer.prototype.lookupXSize = [
	//Square:
	8,  16, 32, 64,
	//Vertical Rectangle:
	16, 32, 32, 64,
	//Horizontal Rectangle:
	8,   8, 16, 32
];
GameBoyAdvanceOBJRenderer.prototype.lookupYSize = [
	//Square:
	8,  16, 32, 64,
	//Vertical Rectangle:
	8,   8, 16, 32,
	//Horizontal Rectangle:
	16, 32, 32, 64
];
GameBoyAdvanceOBJRenderer.prototype.initialize = function (line) {
	this.scratchBuffer = getInt32Array(240);
	this.scratchWindowBuffer = getInt32Array(240);
	this.scratchOBJBuffer = getInt32Array(128);
	this.targetBuffer = null;
}
GameBoyAdvanceOBJRenderer.prototype.renderScanLine = function (line) {
	this.targetBuffer = this.scratchBuffer;
	this.performRenderLoop(line, false);
	return this.scratchBuffer;
}
GameBoyAdvanceOBJRenderer.prototype.renderWindowScanLine = function (line) {
	this.targetBuffer = this.scratchWindowBuffer;
	this.performRenderLoop(line, true);
	return this.scratchWindowBuffer;
}
GameBoyAdvanceOBJRenderer.prototype.performRenderLoop = function (line, isOBJWindow) {
	this.clearScratch();
	for (var objNumber = 0; objNumber < 0x80; ++objNumber) {
		this.renderSprite(line, this.gfx.OAMTable[objNumber], isOBJWindow);
	}
}
GameBoyAdvanceOBJRenderer.prototype.clearScratch = function () {
	for (var position = 0; position < 240; ++position) {
		this.targetBuffer[position] = this.gfx.transparency;
	}
}
GameBoyAdvanceOBJRenderer.prototype.renderSprite = function (line, sprite, isOBJWindow) {
	if (this.isDrawable(sprite, isOBJWindow)) {
		if (sprite.mosaic) {
			//Correct line number for mosaic:
			line -= this.gfx.mosaicRenderer.getOBJMosaicYOffset(line);
		}
        //Obtain horizontal size info:
        var xSize = this.lookupXSize[(sprite.shape << 2) | sprite.size] << ((sprite.doubleSizeOrDisabled) ? 1 : 0);
        //Obtain vertical size info:
		var ySize = this.lookupYSize[(sprite.shape << 2) | sprite.size] << ((sprite.doubleSizeOrDisabled) ? 1 : 0);
		//Obtain some offsets:
        var ycoord = sprite.ycoord;
		var yOffset = line - ycoord;
        //Overflow Correction:
        if (ycoord + ySize > 0x1FF) {
            yOffset -= 0x200;
        }
        else if (yOffset < 0) {
            yOffset += 0x100;
        }
        //Make a sprite line:
        if ((yOffset & --ySize) == yOffset) {
            if (sprite.matrix2D) {
                //Scale & Rotation:
                this.renderMatrixSprite(sprite, xSize, ySize + 1, yOffset);
            }
            else {
                //Regular Scrolling:
                this.renderNormalSprite(sprite, xSize, ySize, yOffset);
            }
            //Mark for semi-transparent:
            if (sprite.mode == 1) {
                this.markSemiTransparent(xSize);
            }
            //Copy OBJ scratch buffer to scratch line buffer:
            this.outputSpriteToScratch(sprite, xSize);
        }
	}
}
GameBoyAdvanceOBJRenderer.prototype.renderMatrixSprite = function (sprite, xSize, ySize, yOffset) {
    var xDiff = -(xSize >> 1);
    var yDiff = (yOffset - (ySize >> 1));
    var xSizeOriginal = xSize >> ((sprite.doubleSizeOrDisabled) ? 1 : 0);
    var ySizeOriginal = ySize >> ((sprite.doubleSizeOrDisabled) ? 1 : 0);
    var params = this.gfx.OBJMatrixParameters[sprite.matrixParameters];
    var dx = params[0];
    var dmx = params[1];
    var dy = params[2];
    var dmy = params[3];
	var pa = dx * xDiff;
	var pb = dmx * yDiff;
	var pc = dy * xDiff;
	var pd = dmy * yDiff;
	var x = pa + pb + (xSizeOriginal >> 1);
	var y = pc + pd + (ySizeOriginal >> 1);
	var tileNumber = sprite.tileNumber;
	for (var position = 0; position < xSize; ++position, x += dx, y += dy) {
		if (x >= 0 && y >= 0 && x < xSizeOriginal && y < ySizeOriginal) {
			//Coordinates in range, fetch pixel:
			this.scratchOBJBuffer[position] = this.fetchMatrixPixel(sprite, tileNumber, x | 0, y | 0, xSizeOriginal);
		}
		else {
			//Coordinates outside of range, transparency defaulted:
			this.scratchOBJBuffer[position] = this.gfx.transparency;
		}
	}
}
GameBoyAdvanceOBJRenderer.prototype.fetchMatrixPixel = function (sprite, tileNumber, x, y, xSize) {
	var address = this.tileNumberToAddress(sprite, tileNumber, xSize, y);
	if (sprite.monolithicPalette) {
		//256 Colors / 1 Palette:
		address += this.tileRelativeAddressOffset(x,y);
		return this.gfx.paletteOBJ256[this.gfx.VRAM[address]];
	}
	else {
		//16 Colors / 16 palettes:
		address += this.tileRelativeAddressOffset(x,y) >> 1;
		if ((x & 0x1) == 0) {
			return this.gfx.paletteOBJ16[sprite.paletteNumber][this.gfx.VRAM[address] & 0xF];
		}
		else {
			return this.gfx.paletteOBJ16[sprite.paletteNumber][this.gfx.VRAM[address] >> 4];
		}
	}
}
GameBoyAdvanceOBJRenderer.prototype.tileRelativeAddressOffset = function (x, y) {
    return (((y & 7) + (x & -8)) << 3) + (x & 0x7);
}
GameBoyAdvanceOBJRenderer.prototype.renderNormalSprite = function (sprite, xSize, ySize, yOffset) {
	if (sprite.verticalFlip) {
		//Flip y-coordinate offset:
		yOffset = ySize - yOffset;
	}
	var address = this.tileNumberToAddress(sprite, sprite.tileNumber, xSize, yOffset);
	var vram = this.gfx.VRAM;
    var data = 0;
	var objBufferPosition = 0;
	if (sprite.monolithicPalette) {
		//256 Colors / 1 Palette:
		address += (yOffset & 7) << 3;
		var palette = this.gfx.paletteOBJ256;
		while (objBufferPosition < xSize) {
			this.scratchOBJBuffer[objBufferPosition++] = palette[vram[address++]];
			this.scratchOBJBuffer[objBufferPosition++] = palette[vram[address++]];
			this.scratchOBJBuffer[objBufferPosition++] = palette[vram[address++]];
			this.scratchOBJBuffer[objBufferPosition++] = palette[vram[address++]];
			this.scratchOBJBuffer[objBufferPosition++] = palette[vram[address++]];
			this.scratchOBJBuffer[objBufferPosition++] = palette[vram[address++]];
			this.scratchOBJBuffer[objBufferPosition++] = palette[vram[address++]];
			this.scratchOBJBuffer[objBufferPosition++] = palette[vram[address]];
			address += 0x39;
		}
	}
	else {
		//16 Colors / 16 palettes:
		address += (yOffset & 7) << 2;
		var palette = this.gfx.paletteOBJ16[sprite.paletteNumber];
		while (objBufferPosition < xSize) {
			data = vram[address++];
			this.scratchOBJBuffer[objBufferPosition++] = palette[data & 0xF];
            this.scratchOBJBuffer[objBufferPosition++] = palette[data >> 4];
			data = vram[address++];
			this.scratchOBJBuffer[objBufferPosition++] = palette[data & 0xF];
            this.scratchOBJBuffer[objBufferPosition++] = palette[data >> 4];
			data = vram[address++];
			this.scratchOBJBuffer[objBufferPosition++] = palette[data & 0xF];
            this.scratchOBJBuffer[objBufferPosition++] = palette[data >> 4];
			data = vram[address];
			this.scratchOBJBuffer[objBufferPosition++] = palette[data & 0xF];
            this.scratchOBJBuffer[objBufferPosition++] = palette[data >> 4];
			address += 0x1D;
		}
	}
}
GameBoyAdvanceOBJRenderer.prototype.tileNumberToAddress = function (sprite, tileNumber, xSize, yOffset) {
	if (!this.gfx.VRAMOneDimensional) {
		//2D Mapping (32 8x8 tiles by 32 8x8 tiles):
		if (sprite.monolithicPalette) {
			//Hardware ignores the LSB in this case:
			tileNumber &= -2;
		}
		tileNumber += (yOffset >> 3) * 0x20;
	}
	else {
		//1D Mapping:
		tileNumber += (yOffset >> 3) * (xSize >> 3);
	}
	//Starting address of currently drawing sprite line:
	return (tileNumber << 5) + 0x10000;
}
GameBoyAdvanceOBJRenderer.prototype.markSemiTransparent = function (xSize) {
	//Mark sprite pixels as semi-transparent:
	while (--xSize > -1) {
		this.scratchOBJBuffer[xSize] |= 0x400000;
	}
}
GameBoyAdvanceOBJRenderer.prototype.outputSpriteToScratch = function (sprite, xSize) {
	//Simulate x-coord wrap around logic:
	var xcoord = sprite.xcoord;
	if (xcoord > (0x200 - xSize)) {
		xcoord -= 0x200;
	}
	//Perform the mosaic transform:
	if (sprite.mosaic) {
		this.gfx.mosaicRenderer.renderOBJMosaicHorizontal(this.scratchOBJBuffer, xcoord, xSize);
	}
	//Resolve end point:
	var xcoordEnd = Math.min(xcoord + xSize, 240);
	//Flag for compositor to ID the pixels as OBJ:
	var bitFlags = (sprite.priority << 23) | 0x100000;
	if (!sprite.horizontalFlip || sprite.matrix2D) {
		//Normal:
		for (var xSource = 0; xcoord < xcoordEnd; ++xcoord, ++xSource) {
			var pixel = bitFlags | this.scratchOBJBuffer[xSource];
            //Overwrite by priority:
			if (xcoord > -1 && (pixel & 0x3800000) < (this.targetBuffer[xcoord] & 0x3800000)) {
				this.targetBuffer[xcoord] = pixel;
			}
		}
	}
	else {
		//Flipped Horizontally:
		for (var xSource = xSize - 1; xcoord < xcoordEnd; ++xcoord, --xSource) {
			var pixel = bitFlags | this.scratchOBJBuffer[xSource];
            //Overwrite by priority:
			if (xcoord > -1 && (pixel & 0x3800000) < (this.targetBuffer[xcoord] & 0x3800000)) {
				this.targetBuffer[xcoord] = pixel;
			}
		}
	}
}
GameBoyAdvanceOBJRenderer.prototype.isDrawable = function (sprite, doWindowOBJ) {
	//Make sure we pass some checks that real hardware does:
	if ((sprite.mode < 2 && !doWindowOBJ) || (doWindowOBJ && sprite.mode == 2)) {
		if (!sprite.doubleSizeOrDisabled || sprite.matrix2D) {
			if (sprite.shape < 3) {
				if (this.gfx.BGMode < 3 || sprite.tileNumber >= 0x200) {
					return true;
				}
			}
		}
	}
	return false;
}