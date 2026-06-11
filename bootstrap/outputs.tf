output "tf_state_resource_group_name" {
  description = "Use this value for GitHub variable TF_STATE_RESOURCE_GROUP_NAME."
  value       = azurerm_resource_group.state.name
}

output "tf_state_storage_account_name" {
  description = "Use this value for GitHub variable TF_STATE_STORAGE_ACCOUNT_NAME."
  value       = azurerm_storage_account.state.name
}

output "tf_state_container_name" {
  description = "Use this value for GitHub variable TF_STATE_CONTAINER_NAME."
  value       = azurerm_storage_container.state.name
}

output "tf_state_key" {
  description = "Use this value for GitHub variable TF_STATE_KEY."
  value       = "infra.tfstate"
}
