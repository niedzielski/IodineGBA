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
function GameBoyAdvanceSWI(CPUCore) {
	this.CPUCore = CPUCore;
	this.IOCore = this.CPUCore.IOCore;
}
GameBoyAdvanceSWI.prototype.execute = function (command) {
	switch (command) {
		//Soft Reset:
		case 0:
			this.SoftReset();
			break;
		//Register Ram Reset:
		case 0x01:
			this.RegisterRAMReset();
			break;
		//Halt:
		case 0x02:
			this.Halt();
			break;
		//Stop:
		case 0x03:
			this.Stop();
			break;
		//Interrupt Wait:
		case 0x04:
			this.IntrWait();
			break;
		//Undefined:
		default:
			//Don't do anything if we get here, although a real device errors.
	}
}