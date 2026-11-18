// Inkoopprijs (excl. btw) en verzendkosten naar NL per SKU bij Droppery, uit het Droppery-scherm op 18 nov 2026 (Products: Supplier price en Shipping cost).
// Droppery stuurt via de WooCommerce-koppeling alleen de adviesprijs; deze lijst vult dat tot de leveranciersprijs automatisch meekomt.
// Verzending: TTP Concepts (Kela, Viva, Joseph Joseph) EUR 9,98 tot 25 kg; Bazar Bizar EUR 15 per order.
// fitting_sku: de kap wordt zonder snoer en fitting geleverd; deze plafondfitting (zelfde leverancier, 1 verzending) hoort er standaard bij om retouren te voorkomen.
export default {
  "KE 166396": {
    "inkoop": 27.0,
    "verzend_nl": 9.98
  },
  "VI 784028": {
    "inkoop": 26.0,
    "verzend_nl": 9.98
  },
  "JJ 000221": {
    "inkoop": 24.0,
    "verzend_nl": 9.98
  },
  "KE 109485": {
    "inkoop": 25.0,
    "verzend_nl": 9.98
  },
  "VI 849000": {
    "inkoop": 26.0,
    "verzend_nl": 9.98
  },
  "JJ 103038": {
    "inkoop": 28.0,
    "verzend_nl": 9.98
  },
  "INEM028Bra-XL": {
    "inkoop": 249.95,
    "verzend_nl": 15.0
  },
  "BAYU022B-XL": {
    "inkoop": 179.97,
    "verzend_nl": 15.0,
    "fitting_sku": "FL-B-001"
  },
  "BAYU022B-XXL": {
    "inkoop": 299.97,
    "verzend_nl": 15.0,
    "fitting_sku": "FL-B-001"
  },
  "BAYU051B-XL": {
    "inkoop": 239.97,
    "verzend_nl": 15.0,
    "fitting_sku": "FL-B-001"
  },
  "BALIN010DW-XL": {
    "inkoop": 299.95,
    "verzend_nl": 15.0,
    "fitting_sku": "FL-B-001"
  },
  "BAYU010N-XL-110": {
    "inkoop": 399.95,
    "verzend_nl": 15.0,
    "fitting_sku": "FL-NW-001"
  },
  "BAYU010N-XXL-150": {
    "inkoop": 699.95,
    "verzend_nl": 15.0,
    "fitting_sku": "FL-NW-001"
  },
  "FL-B-001": {
    "inkoop": 17.5,
    "verzend_nl": 15.0
  },
  "FL-NW-001": {
    "inkoop": 17.5,
    "verzend_nl": 15.0
  }
};
