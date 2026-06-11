
resource "azurerm_resource_group" "rg" {
  name     = "${var.name}-rg"
  location = var.location
}

resource "azurerm_static_web_app" "static-web-app" {
  name                = "${var.name}-swa"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.location

  sku_tier = "Free"
  sku_size = "Free"
}