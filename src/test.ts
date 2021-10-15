import express from "express";
import { JSDOM } from "jsdom";
import path from "path";
import { interactiveExample, nodeStaticRender } from ".";

const app = express();

app.use(express.static(__dirname + "/public"));

app.get("/:page", function (req, res, next) {
  if (path.extname(req.params.page)) {
    next();
  } else {
    const dom = new JSDOM(`
    <html>
        <head>
            <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body>
            <div id="#root"></div>
        </body>
    </html>`);

    dom.window.document
      .getElementById("#root")
      ?.append(
        nodeStaticRender(dom.window.document, interactiveExample, req.query)
      );

    return res.send(dom.serialize());
    // return res.sendFile(
    //   path.join(__dirname + `/views/${req.params.page}.html`)
    // );
  }
});

app.listen(3000);

console.log("Running at Port 3000");
