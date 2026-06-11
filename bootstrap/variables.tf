variable "location" {
  type        = string
  description = "Azure region where the Terraform state backend resources will be deployed."
  default     = "eastus"
}

variable "state_resource_group_name" {
  type        = string
  description = "Name of the resource group that stores Terraform remote state resources."
}

variable "state_storage_account_name" {
  type        = string
  description = "Globally unique storage account name for Terraform remote state. Must be 3-24 lowercase letters and numbers."

  validation {
    condition     = can(regex("^[a-z0-9]{3,24}$", var.state_storage_account_name))
    error_message = "The storage account name must be 3-24 characters and contain only lowercase letters and numbers."
  }
}

variable "state_container_name" {
  type        = string
  description = "Blob container name for Terraform remote state."
  default     = "tfstate"
}
