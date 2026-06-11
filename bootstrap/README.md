# Bootstrap Terraform State

This Terraform root uses local state by default. Run it once from a trusted machine to create the Azure Storage backend used by `infra/`.

```powershell
cd bootstrap
Copy-Item terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

After apply, copy the output values into GitHub repository variables:

```text
TF_STATE_RESOURCE_GROUP_NAME
TF_STATE_STORAGE_ACCOUNT_NAME
TF_STATE_CONTAINER_NAME
TF_STATE_KEY
```

The storage account name must be globally unique, lowercase, and 3-24 characters.
