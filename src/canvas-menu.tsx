import React, { useState, useEffect } from 'react';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  NodeIndexOutlined,
  DisconnectOutlined,
  TagOutlined,
  SearchOutlined,
  HighlightOutlined,
} from '@ant-design/icons';

const isBrowser = typeof window !== 'undefined';
const G6 = isBrowser ? require('@antv/g6') : null;
const insertCss = isBrowser ? require('insert-css') : null;
const modifyCSS = isBrowser ? require('@antv/dom-util/lib/modify-css').default : null;

// https://github.com/antvis/G6/blob/master/packages/site/site/pages/canvas-menu.tsx

if (isBrowser) {
  insertCss(`
  #canvas-menu {
    position: absolute;
    z-index: 2;
    left: 16px;
    top: 16px;
    width: fit-content;
    padding: 8px 16px;
    background-color: rgba(54, 59, 64, 0);
    border-radius: 24px;
    box-shadow: 0 5px 18px 0 rgba(0, 0, 0, 0);
    font-family: PingFangSC-Semibold;
    transition: all 0.2s linear;
  }
  #canvas-menu:hover {
    background-color: rgba(54, 59, 64, 1);
    box-shadow: 0 5px 18px 0 rgba(0, 0, 0, 0.6);
  }
  .icon-span {
    padding-left: 8px;
    padding-right: 8px;
    cursor: pointer;
  }
  #search-node-input {
    background-color: rgba(60, 60, 60, 0.95);
    border-radius: 21px;
    width: 100px;
    border-color: rgba(80, 80, 80, 0.95);
    border-style: solid;
    color: rgba(255, 255, 255, 0.85);
  }
  #submit-button {
    background-color: rgba(82, 115, 224, 0.2);
    border-radius: 21px;
    border-color: rgb(82, 115, 224);
    border-style: solid;
    color: rgba(152, 165, 254, 1);
    margin-left: 4px;
  }
  .menu-tip {
    position: absolute;
    right: calc(30% + 32px);
    width: fit-content;
    height: 40px;
    line-height: 40px;
    top: 80px;
    padding-left: 16px;
    padding-right: 16px;
    background-color: rgba(54, 59, 64, 0.5);
    color: rgba(255, 255, 255, 0.65);
    border-radius: 8px;
    transition: all 0.2s linear;
    font-family: PingFangSC-Semibold;
  }
  #g6-canavs-menu-item-tip {
    position: absolute;
    background-color: rgba(0,0,0, 0.65);
    padding: 10px;
    box-shadow: rgba(0, 0, 0, 0.6) 0px 0px 10px;
    width: fit-content;
    color: #fff;
    border-radius: 8px;
    font-size: 12px;
    height: fit-content;
    top:0;
    left:0;
    font-family: PingFangSC-Semibold;
    transition: all 0.2s linear;
  }
`);
}

let fishEye = null;

const CanvasMenu: React.FC<{
  graph: any;
  clickFisheyeIcon: (onlyDisable?: boolean) => void;
  clickLassoIcon: (onlyDisable?: boolean) => void;
  fisheyeEnabled: boolean;
  lassoEnabled: boolean;
  edgeLabelVisible: boolean;
  setEdgeLabelVisible: (vis: boolean) => void;
  searchNode: (id: string) => boolean;
  handleFindPath: () => void;
  stopLayout: () => void;
}> = ({
  graph,
  clickFisheyeIcon,
  clickLassoIcon,
  fisheyeEnabled,
  lassoEnabled,
  stopLayout,
  edgeLabelVisible,
  setEdgeLabelVisible,
  searchNode,
  handleFindPath,
}) => {

  // menu tip, ?????? ????????? ESC ???????????????
  const [menuTip, setMenuTip] = useState({
    text: '',
    display: 'none',
    opacity: 0,
  });

  // menu item tip
  const [menuItemTip, setMenuItemTip] = useState({
    text: '',
    display: 'none',
    opacity: 0,
  });

  const [enableSearch, setEnableSearch] = useState(false);

  const [enableSelectPathEnd, setEnableSelectPathEnd] = useState(false);

  const clickEdgeLabelController = () => {
    setEdgeLabelVisible(!edgeLabelVisible);
  };

  const handleEnableSearch = () => {
    // ?????? lasso ??????
    if (lassoEnabled) clickLassoIcon(true);
    // ????????????????????????
    if (enableSelectPathEnd) setEnableSelectPathEnd(false);
    // ?????????????????????
    if (enableSearch) setEnableSearch(false);
    // ?????? fisheye
    if (fisheyeEnabled && fishEye) {
      graph.removePlugin(fishEye);
      clickFisheyeIcon(true);
    }
    setEnableSearch((old) => {
      if (old) {
        // ?????? menuTip
        setMenuTip({
          text: '',
          display: 'none',
          opacity: 0,
        });
        return false;
      }

      // ?????? menuTip
      setMenuTip({
        text: '??????????????????????????? ID???????????? Submit ??????',
        display: 'block',
        opacity: 1,
      });
      return true;
    });
  };
  // ??????
  const handleZoomOut = () => {
    if (!graph || graph.destroyed) return;
    const current = graph.getZoom();
    const canvas = graph.get('canvas');
    const point = canvas.getPointByClient(canvas.get('width') / 2, canvas.get('height') / 2);
    const pixelRatio = canvas.get('pixelRatio') || 1;
    const ratio = 1 + 0.05 * 5;
    if (ratio * current > 5) {
      return;
    }
    graph.zoom(ratio, { x: point.x / pixelRatio, y: point.y / pixelRatio });
  };

  // ??????
  const handleZoomIn = () => {
    if (!graph || graph.destroyed) return;

    const current = graph.getZoom();
    const canvas = graph.get('canvas');
    const point = canvas.getPointByClient(canvas.get('width') / 2, canvas.get('height') / 2);
    const pixelRatio = canvas.get('pixelRatio') || 1;
    const ratio = 1 - 0.05 * 5;
    if (ratio * current < 0.3) {
      return;
    }
    graph.zoom(ratio, { x: point.x / pixelRatio, y: point.y / pixelRatio });
  };

  const handleFitViw = () => {
    if (!graph || graph.destroyed) return;
    graph.fitView(16);
  };

  const handleSearchNode = () => {
    const value = (document.getElementById('search-node-input') as HTMLInputElement).value;
    const found = searchNode(value);
    if (!found)
      setMenuTip({
        text: '?????????????????????',
        display: 'block',
        opacity: 1,
      });
  };

  const showItemTip = (e, text) => {
    const { clientX: x, clientY: y } = e;
    setMenuItemTip({
      text,
      display: 'block',
      opacity: 1,
    });
    const tipDom = document.getElementById('g6-canavs-menu-item-tip');
    modifyCSS(tipDom, {
      top: `${56}px`,
      left: `${x - 20}px`,
      zIndex: 100,
    });
  };

  const hideItemTip = () => {
    setMenuItemTip({
      text: '',
      display: 'none',
      opacity: 0,
    });
    const tipDom = document.getElementById('g6-canavs-menu-item-tip');
    modifyCSS(tipDom, {
      zIndex: -100,
    });
  };
  /**
   * ?????????????????????????????????
   */
  const toggleFishEye = () => {
    if (!graph || graph.destroyed) return;

    // ???????????????????????????
    graph.get('canvas').setCursor('default');

    // ?????? FishEye
    if (fisheyeEnabled && fishEye) {
      graph.removePlugin(fishEye);
      graph.setMode('default');

      // ?????? menuTip
      setMenuTip({
        text: '?????? Esc ????????????????????????',
        display: 'none',
        opacity: 0,
      });
    } else {
      // ????????????
      stopLayout();

      // ?????? lasso ??????
      if (lassoEnabled) clickLassoIcon(true);
      // ????????????????????????
      if (enableSelectPathEnd) setEnableSelectPathEnd(false);
      // ?????????????????????
      if (enableSearch) setEnableSearch(false);

      // ?????? menuTip
      setMenuTip({
        text: '?????? Esc ????????????????????????',
        display: 'block',
        opacity: 1,
      });

      // ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
      graph.setMode('fisheyeMode');
      // ?????? FishEye
      fishEye = new G6.Fisheye({
        r: 249,
        scaleRByWheel: true,
        minR: 100,
        maxR: 500,
        // showLabel: true,
      });

      graph.addPlugin(fishEye);
    }
    clickFisheyeIcon();
  };

  // ?????? lasso select ??????
  const enabledLassoSelect = () => {
    if (!graph || graph.destroyed) return;
    clickLassoIcon();
    if (!lassoEnabled) {
      graph.setMode('lassoSelect');

      // ??????????????????????????????
      graph.get('canvas').setCursor('crosshair');

      // ?????? fisheye
      if (fisheyeEnabled && fishEye) {
        graph.removePlugin(fishEye);
        clickFisheyeIcon(true);
      }
      // ????????????????????????
      if (enableSelectPathEnd) setEnableSelectPathEnd(false);
      // ?????????????????????
      if (enableSearch) setEnableSearch(false);

      // ?????? menuTip
      setMenuTip({
        text: '?????? Esc ???????????????????????????',
        display: 'block',
        opacity: 1,
      });
    } else {
      graph.setMode('default');

      // ???????????????????????????
      graph.get('canvas').setCursor('default');

      // ?????? menuTip
      setMenuTip({
        text: '?????? Esc ???????????????????????????',
        display: 'none',
        opacity: 0,
      });
    }
  };

  // ??????????????????????????????????????????
  const handleEnableSelectPathEnd = () => {
    setEnableSelectPathEnd((old) => {
      if (!old) {
        graph.setMode('default');
        // ?????? fisheye
        if (fishEye) {
          graph.removePlugin(fishEye);
          clickFisheyeIcon(true);
        }
        // ?????? lasso ??????
        if (lassoEnabled) clickLassoIcon(true);

        // ?????????????????????
        if (enableSearch) setEnableSearch(false);

        // ?????? menuTip
        setMenuTip({
          text: '?????? SHIFT ?????????????????????????????????????????????',
          display: 'block',
          opacity: 1,
        });
        return true;
      }
      // ?????? menuTip
      setMenuTip({
        text: '',
        display: 'none',
        opacity: 0,
      });
      return false;
    });
  };

  const escListener = (e) => {
    if (!graph || graph.destroyed) return;
    if (e.key !== 'Escape') return;
    if (fishEye) {
      graph.removePlugin(fishEye);
      clickFisheyeIcon(true);
    }
    // ?????? lasso ??????
    graph.setMode('default');
    // ?????????????????????
    setEnableSearch(false);
    // ????????????????????????
    setEnableSelectPathEnd(false);

    // ???????????????????????????
    graph.get('canvas').setCursor('default');
    clickLassoIcon(true);

    // ?????? menuTip
    setMenuTip({
      text: '?????? Esc ?????????????????????',
      display: 'none',
      opacity: 0,
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', escListener.bind(this));
      return window.removeEventListener('keydown', escListener.bind(this));
    }
  }, []);

  const iconStyle = {
    disable: { color: 'rgba(255, 255, 255, 0.85)' },
    enable: { color: 'rgba(82, 115, 224, 1)' },
  };

  return (
    <>
      <div id="canvas-menu">
        <div className="icon-container">
          <span
            className="icon-span"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
            onClick={clickEdgeLabelController}
            onMouseEnter={(e) =>
              showItemTip(e, edgeLabelVisible ? '???????????????' : '???????????????')
            }
            onMouseLeave={hideItemTip}
          >
            {edgeLabelVisible ? (
              <DisconnectOutlined style={iconStyle.enable} />
            ) : (
              <TagOutlined style={iconStyle.disable} />
            )}
          </span>
          <span
            className="icon-span"
            onClick={toggleFishEye}
            onMouseEnter={(e) =>
              showItemTip(e, fisheyeEnabled ? '?????????????????????' : '?????????????????????')
            }
            onMouseLeave={hideItemTip}
          >
            {fisheyeEnabled ? (
              <EyeInvisibleOutlined style={iconStyle.enable} />
            ) : (
              <EyeOutlined style={iconStyle.disable} />
            )}
          </span>
          <span
            className="icon-span"
            onClick={enabledLassoSelect}
            onMouseEnter={(e) =>
              showItemTip(e, lassoEnabled ? '????????????????????????' : '????????????????????????')
            }
            onMouseLeave={hideItemTip}
          >
            <HighlightOutlined style={lassoEnabled ? iconStyle.enable : iconStyle.disable} />
          </span>
          <span
            className="icon-span"
            onClick={handleEnableSelectPathEnd}
            onMouseEnter={(e) => showItemTip(e, '??????????????????')}
            onMouseLeave={hideItemTip}
          >
            <NodeIndexOutlined style={enableSelectPathEnd ? iconStyle.enable : iconStyle.disable} />
          </span>
          <span className="icon-span" style={{ width: 'fit-content', ...iconStyle.disable }}>
            <span
              className="zoom-icon"
              onClick={handleZoomIn}
              onMouseEnter={(e) => showItemTip(e, '??????')}
              onMouseLeave={hideItemTip}
            >
              -
            </span>
            <span
              className="zoom-icon"
              onClick={handleFitViw}
              onMouseEnter={(e) => showItemTip(e, '????????????????????????????????????ctrl + 1')}
              onMouseLeave={hideItemTip}
              style={{ paddingLeft: '8px', paddingRight: '8px' }}
            >
              FIT
            </span>
            <span
              className="zoom-icon"
              onClick={handleZoomOut}
              onMouseEnter={(e) => showItemTip(e, '??????')}
              onMouseLeave={hideItemTip}
            >
              +
            </span>
          </span>
          <span
            className="icon-span"
            onClick={handleEnableSearch}
            onMouseEnter={(e) => showItemTip(e, '?????? ID ????????????')}
            onMouseLeave={hideItemTip}
          >
            <SearchOutlined style={enableSearch ? iconStyle.enable : iconStyle.disable} />
          </span>
          {enableSearch && (
            <span
              onMouseEnter={(e) => showItemTip(e, '??????????????????????????? ID???????????? Submit ??????')}
              onMouseLeave={hideItemTip}
            >
              <input type="text" id="search-node-input" />
              <button id="submit-button" onClick={handleSearchNode}>
                Submit
              </button>
            </span>
          )}
          {enableSelectPathEnd && (
            <span
              onMouseEnter={(e) =>
                showItemTip(e, '?????????????????????????????????????????????????????? Find Path ??????')
              }
              onMouseLeave={hideItemTip}
            >
              <button id="submit-button" onClick={handleFindPath}>
                Find Path
              </button>
            </span>
          )}
        </div>
      </div>
      <div className="menu-tip" style={{ opacity: menuTip.opacity }}>
        {menuTip.text}
      </div>
      <div id="g6-canavs-menu-item-tip" style={{ opacity: menuItemTip.opacity }}>
        {menuItemTip.text}
      </div>
    </>
  );
};

export default CanvasMenu;