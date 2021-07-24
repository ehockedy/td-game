import ReactDOM from 'react-dom';
import React from 'react';
import "./include/pixi/pixi.min.js"  // TODO try importing this

import { MainMenu } from "./js/views/main_menu_react.js"


ReactDOM.render(
    <MainMenu />,
    document.getElementById('root')
  );