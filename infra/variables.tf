variable "name" {
  type        = string
  description = "Name that can be used across multiple resources"

}

variable "location" {
  type        = string
  description = "Azure region where resources will be deployed."
  default     = "eastus"
}