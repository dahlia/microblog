Federated microblog example using Fedify
========================================

> [!WARNING]
> This program is for educational purposes only. Do not use it for any other
> purpose, since it has not been tested for security.

This is a simple federated microblog example using [Fedify].  The features of
this program are:

 -  A user can create an account (up to one account)
 -  A user can be followed by other actors in the fediverse
 -  A follower can unfollow a user
 -  A user can see the list of their followers
 -  A user can post a message
 -  Posts made by a user are visible to their followers in the fediverse
 -  A user can follow other actors in the fediverse
 -  A user can see the list of actors they are following
 -  A user can see the list of posts made by actors they are following

Since it is a simple example for educational purposes, it has a lot of
limitations:

 -  A user cannot configure their profile (bio, picture, etc.)
 -  A user cannot delete their account
 -  A user cannot edit/delete their posts
 -  A user cannot unfollow an actor they once followed
 -  No likes, shares (reposts), or replies
 -  No search feature
 -  No security features (authentication, authorization, etc.)

[Fedify]: https://fedify.dev/


Dependencies
------------

This program is written in TypeScript and uses [Node.js].  You need to have
Node.js 20.0.0 or later installed on your system to run this program.

It also depends on few external libraries besides [Fedify]:

 -  [Hono] for web framework
 -  [SQLite] for database
 -  A few other libraries; see *package.json* for details

[Node.js]: https://nodejs.org/
[Hono]: https://hono.dev/
[SQLite]: https://www.sqlite.org/


How to run
----------

To run this program, you need to install the dependencies first.  You can do
that by running the following command:

~~~~ sh
npm install --include=dev
~~~~

After installing the dependencies, you need to create the database schema.
You can do that by running the following command:

~~~~ sh
npm run createdb
~~~~

> [!NOTE]
> The above command requires the `sqlite3` program to be installed on your
> system.  If it is not installed, you can install it using your package
> manager.  For example, on Debian-based systems, you can install it using the
> following command:
>
> ~~~~ sh
> sudo apt install sqlite3
> ~~~~
>
> On macOS, you probably already have it installed.
>
> On Windows, you can download *sqlite-tools-win-x64-\*.zip* from the SQLite
> website's [download page][1] and extract it to a directory in your `PATH`.

After creating the database schema, you can run the program using the following
command:

~~~~ sh
npm run prod
~~~~

This will start the program on port 8000.  You can access the program by
visiting <http://localhost:8000/> in your web browser.  However, since this
program is an ActivityPub server, you probably need to expose it to the public
internet to communicate with other servers in the fediverse.  In that case, you
can use [tunneling services][2].

[1]: https://www.sqlite.org/download.html
[2]: https://fedify.dev/manual/test#exposing-a-local-server-to-the-public


License
-------

This program is licensed under the [MIT License].  See the *LICENSE* file for
details.

[MIT License]: https://minhee.mit-license.org/2024/
