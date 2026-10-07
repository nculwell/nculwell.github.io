= Reverse engineering Adventure Contruction Set

Adventure Contruction Set (henceforth "ACS") was one of the first computer games I ever owned. As such, it's one of the most nostalgic games for me personally, and when I got interested in reverse-engineering retro game, it was one of the first that came to mind.

Stuart Smith created ACS, and it greatly resembles his earlier efforts. If you play his earlier games -- Fracas (1980), Ali Baba and the Forty Thieves (1981), Return of Heracles (1983) -- then you can see how his system progressed over time. ACS essentially turns the engine of Ali Baba / Heracles into a system that can be modified by the user.

The game itself has two modes: creating a game, and playing a game. If you simply want to play a game, there are two ready-made games included, "Rivers of Light" and "Land of Aventuria." Rivers of Light takes place on a main map called "The Fertile Crescent," and is based on ancient Middle Eastern mythology, particularly the Epic of Gilgamesh. Land of Aventuria is a tutorial adventure that consists of seven parts, each with a completely different theme and plot (e.g. Alice in Wonderland, Washington crossing the Delaware, James Bond). Each of these games was built using the construction system, so you can open them up, see how they're built, and edit them.

Although ACS is obscure today, it does seem to have a certain cult following. It had a lot of impact on people back in the 1980s because it was one of the few ways to make a real graphical game without any programming.

ACS was published by Electronic Arts, and released for the Commodore 64 ("C64") in 1984. It was proted to the Apple II in 1985, to the Amiga in 1986 and to DOS in 1987.

== My reverse engineering project

I stared work on this project in June 2021. Although I originally played ACS on the Apple //c, I decided to use the C64 because that seemed like the best version of the game. All of my programming experience with the Apple II was in BASIC, so this would be my first time really dealing with the internals of a 6502 machine. (Note: the C64 and the Apple II series have nearly the same CPU, which means that a lot of knowledge about one transfers to the other, but there are also a lot of hardware details that make them different.)

In the beginning, I hadn't intended to fully reverse engineer the game. I intended to create a saved game editor, similar to ones I'd made in the past for some DOS games. The obvious approach for making a saved game editor is as follows:

- start a game and save it
- copy the save file
- do something in the game to change the save state
- save the game again
- do a binary diff of the first old save file and the new one

Since you know what you did in the game, hopefully the changes in the save file will correspond to your action in an obvious way; then you know what that part of the save file does.

ACS should be a prime candidate for this kind of project, because it has an editor that exposes every detail of the game's construction. In ACS, the "save file" is just the entire game disk, and it contains all the details of your adventure as well as your current progress. By making changes in the game editor, you can figure out how the game data is laid out.

I made significant progress with this save-and-diff approach, but eventually I began to dig deeper, reverse engineering the code itself. This led me down a deep rabbit hole. I used [VICE Emulator](https://vice-emu.sourceforge.io/) to run the game, inspect the machine state and generate traces. I downloaded Andy McFadden's [6502bench SourceGen](https://6502bench.com/) and started disassembling the game's code, learning 6502 assembly language in the process. Eventually I wrote my own C64 emulator in order to get more information about what the game was doing. Finally, I wrote a decompiler to reconstruct source code for the game.

The project remains incomplete, but I've learned a lot, so I can already share quite a bit of information about the game. I've returned to this project a few times over the years since I started it, and I hope someday to call it complete.

== The logical structure of an ACS adventure

A map in ACS consists of a grid. There are two types of maps, the world map (one per adventure, 40x40) and region maps. Spaces in the world map each have a "terrain," and each terrain type has an image and some options for its behavior (e.g. passable/impassable, if it's a doorway to a region). Regions have a layout with multiple rooms, and each room contains a grid that's visually similar to the world map. A room, however, has a limited size

== What I learned from diffing game disks

When I started diffing game disks, the first thing I did was write some Python scripts to help me. First, I wrote [dumptext.py](https://github.com/nculwell/retrotools/blob/main/c64/py/dumptext.py), which simply prints the contents of the disk image in a readable form. My other important script for this part was [ddiff.py](https://github.com/nculwell/retrotools/blob/main/c64/py/ddiff.py), which does a binary diff and prints the results in a convenient format, supporting a few different conversions to readable formats (e.g. displaying bytes as text). Early on I figured out that text on disk is usually represented as [C64 screen codes](https://sta.c64.org/cbm64scr.html), which have 1=A, 2=B, etc., but it can also be PETSCII (similar to ASCII but with some variations), and occasionally it's stored in Base 40 (two bytes can store three characters). (It took me quite a while to figure out that what I was seeing was Base 40 text!)

I was pretty quickly able to identify some areas that had obvious uses.

006C00 - 00B800: Long text. Each entry is 8 32-character lines of C64 screen text, with spaces used for formatting. These are the text entries that can displayed when the spell "display long message" is cast.

C64 screen codes: https://sta.c64.org/cbm64scr.html
PETSCII: https://www.c64-wiki.com/wiki/PETSCII

World map: 40x40, 1600 spaces, 800 bytes (1 nibble per space).
Region map: 80x40
Images: 8x16 pixels



"World map": This is the top-level map from which characters begin their adventure. The world map differs from other playable areas of the game in that it has no fixed creature encounters, no stacked tiles, quicker movement, it is scrollable, and it optionally may wrap around (have no borders). Random encounters may occur on the world map, during which the game switches to a special view similar to a "room" to handle the encounter.
"Regions": A region is a collection of rooms. A region is a construction concept and does not present itself to the player, except by indirect means such as disk access when traveling between regions.
"Rooms": A room is a rectangular, tiled area of a size which must fit within the game's viewport. Tiles may be used to make a room look like shapes other than rectangular.
"Things": A thing is a background tile, obstacle, or collectible item.
"Creatures"
"Pictures": These are art assets used by the tiles. For some platforms, four colors are available for images. For the Amiga platform, 32 colors are available, each of which can be assigned to be any of 4096 available colors.
