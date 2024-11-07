# Better FanFiction.net

WIP Better search features for FanFiction.net using Tampermonkey or a browser extension.

## Usage

To add stories to the database they will have to be viewed by a user with with the tampermonkey script installed. After a story has been added it can then be searched for using the betterffnet search (WIP).

If there is a sufficient number of people browsing ffnet with this extension installed the searchable database should grow to a usable size.

### Tags

### TOS Considerations

Modifying the service of ffnet is against its terms of service, however i dont think my application causes any harm since it does not utilize a webscrapper to build up the database of searchable stories instead it works with the requests already sent by users just browsing stories.

Additionaly every user interaction still has to go through the fanfiction.net website. And this extension also does not store and provide any story content.

## Installation

### Setup

Create a copy of `.env.example` and rename it to `.env` and adjust the values if needed.

Run `npm install` and `npm run migrate` to create the sqlite file.

Run `npm run dev` or `npm start` to start up the server.

Install the extension in `frontend` on your browser temporarily.

To get initial data into the database login to your `fanfiction.net` account and navigate to `https://www.fanfiction.net/selectcategory.php?cat_s_id=1` (In your profile under Publish / New Story / Select Category).

You should see a small colored indicator, by pressing it the database will track all the currently available fandoms.

### Thanks

(Dark Night Mode)[https://github.com/DarkNightMode/Dark-Night-Mode-Chrome-Extension/tree/master] for being a great darkmode tool, that helped me understand how to improve my own darkmode (no more white flash).