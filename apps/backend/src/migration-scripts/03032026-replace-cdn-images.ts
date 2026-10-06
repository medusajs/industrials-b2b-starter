import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  batchVariantImagesWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows";

const OLD_CDN_HOST = "cdn.mignite.app";

const PRODUCT_IMAGES: Record<
  string,
  {
    thumbnail: string;
    images: string[];
    variantImages?: Record<string, string[]>;
  }
> = {
  "heavy-duty-forklift-forks": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/heavy-duty-forklift-forks--1-01M48EJGP4G7G58J0DN6VJETD2.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/heavy-duty-forklift-forks--1-01M48EJGP4G7G58J0DN6VJETD2.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/heavy-duty-forklift-forks--2-01M48EJGFWX2KW2M3SSZTSHKEE.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/heavy-duty-forklift-forks--3-01M48EJHVWF8P9V29TWJEZQR04.webp"
    ]
  },
  "industrial-forklift-battery": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/industrial-forklift-battery--1-01M48EJHG9THJAV4SDNCDWF3HD.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/industrial-forklift-battery--1-01M48EJHG9THJAV4SDNCDWF3HD.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/industrial-forklift-battery--2-01M48EJHN6SGVF9ZNET05467AR.webp"
    ]
  },
  "pneumatic-forklift-tires": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/pneumatic-forklift-tires--1-01M48EJHVSF0XRFTMG44V3M7R1.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/pneumatic-forklift-tires--1-01M48EJHVSF0XRFTMG44V3M7R1.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/pneumatic-forklift-tires--2-01M48EJHZJBX47WVMJ8PHZKF3H.webp"
    ]
  },
  "led-safety-light-kit": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/led-safety-light-kit--1-01M48EJJF0VQ3127YVVKR1M4W9.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/led-safety-light-kit--1-01M48EJJF0VQ3127YVVKR1M4W9.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/led-safety-light-kit--2-01M48EJJEMR48SEHA8S805E6HF.webp"
    ]
  },
  "backup-alarm-system": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/backup-alarm-system--1-01M48EJJECFTMMZYP843JT6GT6.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/backup-alarm-system--1-01M48EJJECFTMMZYP843JT6GT6.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/backup-alarm-system--2-01M48EJJERGQH4CRZX77K6EGXW.webp"
    ]
  },
  "wide-angle-mirror-set": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/wide-angle-mirror-set--1-01M48EJJRFKAK5NJV1VJ36RPTF.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/wide-angle-mirror-set--1-01M48EJJRFKAK5NJV1VJ36RPTF.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/wide-angle-mirror-set--2-01M48EJKA42WGPS0DTGG23A65G.webp"
    ]
  },
  "carton-clamp-attachment": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/carton-clamp-attachment--1-01M48EJKANGVG3WJ4DVZPVJ4H0.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/carton-clamp-attachment--1-01M48EJKANGVG3WJ4DVZPVJ4H0.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/carton-clamp-attachment--2-01M48EJKGQT39R9SRSZCE6RE1T.webp"
    ]
  },
  "fork-positioner": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/fork-positioner--1-01M48EJK2K1X7KDGPG7T9KRFKF.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/fork-positioner--1-01M48EJK2K1X7KDGPG7T9KRFKF.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/fork-positioner--2-01M48EJM2FNH698216T736BDY1.webp"
    ]
  },
  "drum-handler-attachment": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/drum-handler-attachment--1-01M48EJKPWBAJAVW2WQ1E7AZ21.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/drum-handler-attachment--1-01M48EJKPWBAJAVW2WQ1E7AZ21.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/drum-handler-attachment--2-01M48EJM5QD8XHGJADZNMD2NFA.webp"
    ]
  },
  "fire-extinguisher-bracket": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/fire-extinguisher-bracket--1-01M48EJKYSPZB4W1WXMBS073FT.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/fire-extinguisher-bracket--1-01M48EJKYSPZB4W1WXMBS073FT.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/fire-extinguisher-bracket--2-01M48EJMCAYCQR7FEW501FPVW3.webp"
    ]
  },
  "safety-flag-kit": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/safety-flag-kit--1-01M48EJM8NQNSBHERR3K48TPR8.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/safety-flag-kit--1-01M48EJM8NQNSBHERR3K48TPR8.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/safety-flag-kit--2-01M48EJN2K874MN5HN7BEPH171.webp"
    ]
  },
  "first-aid-kit": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/first-aid-kit--1-01M48EJMSBD4EC80M41RQWBZVF.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/first-aid-kit--1-01M48EJMSBD4EC80M41RQWBZVF.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/first-aid-kit--2-01M48EJMXJRS777T7QTFQRK2NR.webp"
    ]
  },
  "safety-vest": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/safety-vest--1-01M48EJMX0RB8K772Z5VP0F4RA.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/safety-vest--1-01M48EJMX0RB8K772Z5VP0F4RA.webp"
    ]
  },
  "pallet-racking-system": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/pallet-racking-system--1-01M48EJN6SGKN40QBS428EK59F.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/pallet-racking-system--1-01M48EJN6SGKN40QBS428EK59F.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/pallet-racking-system--2-01M48EJNW667FHMBNJMSF9GK5H.webp"
    ]
  },
  "hydraulic-dock-leveler": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/hydraulic-dock-leveler--1-01M48EJNB82GFWB6WQ1JJ8M3AT.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/hydraulic-dock-leveler--1-01M48EJNB82GFWB6WQ1JJ8M3AT.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/hydraulic-dock-leveler--2-01M48EJPBR4DFZZYXX6PKQ4QST.webp"
    ]
  },
  "electric-pallet-jack": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/electric-pallet-jack--1-01M48EJNGM1YB0M6E4P6FJPE2M.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/electric-pallet-jack--1-01M48EJNGM1YB0M6E4P6FJPE2M.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/electric-pallet-jack--2-01M48EJNYX0NF7YCKMR7TWJX28.webp"
    ]
  },
  "warehouse-platform-ladder": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/warehouse-platform-ladder--1-01M48EJNTK4QCPKN52T3F5D56K.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/warehouse-platform-ladder--1-01M48EJNTK4QCPKN52T3F5D56K.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/warehouse-platform-ladder--2-01M48EJPBXN664TT5JXH20C1Z0.webp"
    ]
  },
  "industrial-shelving-unit": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/industrial-shelving-unit--1-01M48EJPK3BHPGVEHX0X13WX8F.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/industrial-shelving-unit--1-01M48EJPK3BHPGVEHX0X13WX8F.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/industrial-shelving-unit--2-01M48EJR43B3GJG9H8952G61RQ.webp"
    ]
  },
  "loading-dock-bumper": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/loading-dock-bumper--1-01M48EJQ3E6SDHT3ZR99CK6MVQ.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/loading-dock-bumper--1-01M48EJQ3E6SDHT3ZR99CK6MVQ.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/loading-dock-bumper--2-01M48EJQ4GHK0C0SG4TV2D5YBA.webp"
    ]
  },
  "dock-plate": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/dock-plate--1-01M48EJQ2GXA2PDP9JKSXHGSVW.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/dock-plate--1-01M48EJQ2GXA2PDP9JKSXHGSVW.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/dock-plate--2-01M48EJQMXSJEQKA8KD2NK4PSS.webp"
    ]
  },
  "gravity-roller-conveyor": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/gravity-roller-conveyor--1-01M48EJQDQGAKJFB7BDJZTG3AY.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/gravity-roller-conveyor--1-01M48EJQDQGAKJFB7BDJZTG3AY.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/gravity-roller-conveyor--2-01M48EJQVHEDYXA9QFSNKWTKNY.webp"
    ]
  },
  "manual-pallet-jack": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/manual-pallet-jack--1-01M48EJQVF4WDS3V4HSJGRCMME.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/manual-pallet-jack--1-01M48EJQVF4WDS3V4HSJGRCMME.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/manual-pallet-jack--2-01M48EJR3XBSNDA75KYK6VYSX1.webp"
    ]
  },
  "hand-truck": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/hand-truck--1-01M48EJR88SJP0FKF6W76ZG5HY.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/hand-truck--1-01M48EJR88SJP0FKF6W76ZG5HY.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/hand-truck--2-01M48EJRH03VHX8DGR4JV9HPPG.webp"
    ]
  },
  "platform-cart": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/platform-cart--1-01M48EJRDQ1DY4JCZ808TAHZS7.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/platform-cart--1-01M48EJRDQ1DY4JCZ808TAHZS7.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/platform-cart--2-01M48EJRSBR7P2N2P5WQE5WP23.webp"
    ]
  },
  "hydraulic-lift-table": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/hydraulic-lift-table--1-01M48EJRMFJHFXAPXFWM17J9C2.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/hydraulic-lift-table--1-01M48EJRMFJHFXAPXFWM17J9C2.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/hydraulic-lift-table--2-01M48EJRRVSN9GD0H8AV95AACW.webp"
    ]
  },
  "drum-dolly": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/drum-dolly--1-01M48EJRVQ0NCM68NHS54GKPA6.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/drum-dolly--1-01M48EJRVQ0NCM68NHS54GKPA6.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/drum-dolly--2-01M48EJS6240JA9B12AR2DNZH4.webp"
    ]
  },
  "tow-tractor": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/tow-tractor--1-01M48EJS64D77HWQJEK4CGWG6K.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/tow-tractor--1-01M48EJS64D77HWQJEK4CGWG6K.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/tow-tractor--2-01M48EJSGT32E71TVNS7E8Q6H3.webp"
    ]
  },
  "ergonomic-operator-seat": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/ergonomic-operator-seat--1-01M48EJSCH1SSFNEMSW2KZQFA4.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/ergonomic-operator-seat--1-01M48EJSCH1SSFNEMSW2KZQFA4.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/ergonomic-operator-seat--2-01M48EJSJYJ7KZAG0XJGMAWBR3.webp"
    ]
  },
  "industrial-work-gloves": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/industrial-work-gloves--1-01M48EJSPAA6T6HW311VKQYEZS.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/industrial-work-gloves--1-01M48EJSPAA6T6HW311VKQYEZS.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/industrial-work-gloves--2-01M48EJSZ5KM280EMEAW72PNPY.webp"
    ]
  },
  "safety-hard-hat": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/safety-hard-hat--1-01M48EJSWFDPBCKKGJ9G0FN9AK.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/safety-hard-hat--1-01M48EJSWFDPBCKKGJ9G0FN9AK.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/safety-hard-hat--2-01M48EJT8D6NRSDT356TR4KQW3.webp"
    ]
  },
  "forklift-suspension-seat": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/forklift-suspension-seat--1-01M48EJTERMJXNW3ZJ3775RZ4B.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/forklift-suspension-seat--1-01M48EJTERMJXNW3ZJ3775RZ4B.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/forklift-suspension-seat--2-01M48EJTR4N004HX96SRDTFKYH.webp"
    ]
  },
  "overhead-guard": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/overhead-guard--1-01M48EJTF6RKSKG8FD5YAFX2MJ.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/overhead-guard--1-01M48EJTF6RKSKG8FD5YAFX2MJ.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/overhead-guard--2-01M48EJTV7Z6W65WG8FM5Z8FT1.webp"
    ]
  },
  "rain-cover": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/rain-cover--1-01M48EJTYTMNEDJD5ST4QH695T.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/rain-cover--1-01M48EJTYTMNEDJD5ST4QH695T.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/rain-cover--2-01M48EJTYAPMJM2104FHE671PR.webp"
    ]
  },
  "operator-heater-kit": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/operator-heater-kit--1-01M48EJV9VX9KRP08NF08HFPP7.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/operator-heater-kit--1-01M48EJV9VX9KRP08NF08HFPP7.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/operator-heater-kit--2-01M48EJVHJ6W2H8SFTQSFQT6GS.webp"
    ]
  },
  "forklift-fan-kit": {
    "thumbnail": "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/forklift-fan-kit--1-01M48EJW2YCNRN2JNH9JH05JZT.webp",
    "images": [
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/forklift-fan-kit--1-01M48EJW2YCNRN2JNH9JH05JZT.webp",
      "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/e18edd5c0b84bb3bd31/forklift-fan-kit--2-01M48EJVGBYX32MQZ5QKJS82ZR.webp"
    ]
  }
};

export default async function migration_03032026_replace_cdn_images({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "thumbnail",
      "images.url",
      "variants.id",
      "variants.title",
      "variants.thumbnail",
    ],
    filters: { handle: Object.keys(PRODUCT_IMAGES) },
  });

  const productsToUpdate = products.filter(
    (product) =>
      product.thumbnail?.includes(OLD_CDN_HOST) ||
      product.images?.some((image) => image?.url.includes(OLD_CDN_HOST))
  );

  if (productsToUpdate.length === 0) {
    logger.info("No products use images from the old CDN, skipping.");
    return;
  }

  await updateProductsWorkflow(container).run({
    input: {
      products: productsToUpdate.map((product) => {
        const { thumbnail, images } = PRODUCT_IMAGES[product.handle];
        return {
          id: product.id,
          thumbnail,
          images: images.map((url) => ({ url })),
        };
      }),
    },
  });

  const { data: updatedProducts } = await query.graph({
    entity: "product",
    fields: ["id", "images.id", "images.url"],
    filters: { id: productsToUpdate.map((product) => product.id) },
  });

  const imageIdsByProduct = new Map(
    updatedProducts.map((product) => [
      product.id,
      new Map((product.images ?? []).map((image) => [image?.url, image?.id])),
    ])
  );

  const variantThumbnails: { id: string; thumbnail: string }[] = [];

  for (const product of productsToUpdate) {
    const { thumbnail, variantImages } = PRODUCT_IMAGES[product.handle];
    const imageIds = imageIdsByProduct.get(product.id);

    for (const variant of product.variants ?? []) {
      if (!variant) {
        continue;
      }
      const color = variant.title?.match(/\/ ([A-Za-z-]+)$/)?.[1];
      const colorUrls = (color && variantImages?.[color]) || [];
      const colorImageIds = colorUrls
        .map((url) => imageIds?.get(url))
        .filter((id): id is string => !!id);

      if (colorImageIds.length > 0) {
        await batchVariantImagesWorkflow(container).run({
          input: { variant_id: variant.id, add: colorImageIds, remove: [] },
        });
      }

      if (variant.thumbnail?.includes(OLD_CDN_HOST)) {
        variantThumbnails.push({
          id: variant.id,
          thumbnail: colorUrls[0] ?? thumbnail,
        });
      }
    }
  }

  if (variantThumbnails.length > 0) {
    await updateProductVariantsWorkflow(container).run({
      input: { product_variants: variantThumbnails },
    });
  }

  logger.info(`Replaced old CDN images of ${productsToUpdate.length} products.`);
}
