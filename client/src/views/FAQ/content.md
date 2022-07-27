### What is this site?

Project Maptroid is an interactive map for Super Metroid and many Super Metroid ROM hacks available at [Metroid Construction](https://metroidconstruction.com/). I'm [Bad At Metroid](https://reddit.com/user/badatmetroid) so I created this site as a way to help myself get unstuck when I can't figure out where to go. If you like Super Metroid there are some 450 ROM hacks available. I've played about 60 of them. If you like Super Metroid it's definitely worth taking the time to install an emulater and patching program. When you get stuck or want to plan out a speed run, come back here.

### How did you add the maps?

I wrote an auto-hotkey script that automates taking screenshots of each of the rooms in [SMILE](https://metroidconstruction.com/SMMM/) (the ROM hack editor people use to make these maps). I then have a script processes those into rooms, locates items, and guesses at the rooms locations in each zones. I then have to manually finish room and zone alignment and do other post processing steps. Each room takes between 3-5 hours to upload. I might make a video of me adding one if there's enough interest.

### Can you add a ROM hack for me?

[DM me on reddit](https://www.reddit.com/message/compose/?to=badatmetroid) or use the [contact form](/contact) and I'll see what I can do. Some maps don't load properly in SMILE. I'm going to reach out to the creators of those maps because the maps with the craziest modifications (and therefore coolest maps) are the one's that I was unable to load.

### Why are some rooms missing?

Some maps like Super Zero Mission and Hyper Metroid are missing rooms because they don't load properly in SMILE. I think the problem is that the authors used configuration files when working with SMILE and without those SMILE crashes when I try to load the rooms.

### Why are some items missing?

The automated extraction process [I described above](#how) only grabs the first room state. This means that if item loads after an event (usually getting morph ball or killing Phantoon), my scraper will miss it. I can manually add the items, so please [contact me](/contact/) if you notice any missing items.

### Why are there extra items?

Okay, you've made it this far in the FAQ so it's real talk time. Some of the ROM hacks are super sloppy. Sometimes the hacker will copy a room and move all unused enemies and items off the screen rather than deleting them. It doesn't matter when you play the game if there's a hidden plasma beam just out of sight that you'll never see. You can't see it so no harm no fowl. But my scraping script sees everything. I just mark them as hidden when I manually clean everything up.

If you notice extra items [contact me](/contact/) and I'll hide them.