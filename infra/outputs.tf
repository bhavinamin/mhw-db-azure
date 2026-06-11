output "static_web_app_default_host_name" {
  description = "Default hostname for the Azure Static Web App."
  value       = azurerm_static_web_app.static-web-app.default_host_name
}

output "static_web_app_api_key" {
  description = "Deployment token for Azure Static Web Apps GitHub Action."
  value       = azurerm_static_web_app.static-web-app.api_key
  sensitive   = true
}
