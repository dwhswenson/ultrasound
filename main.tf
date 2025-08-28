# This is the Terraform configuration for the infrastructure used in this
# project. This is essentially a one-time deployment that sets up the
# Cloudflare Pages project and the GitHub secrets/variables that are needed
# for our static site tooling to work. This does *not* get deployed through
# a GitHub action, but rather is run manually by the project owner. 

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  #backend "s3" {
  #key            = "ultrasound/terraform.tfstate"
  #}
}

provider "aws" {
  region = "us-east-2"
}

provider "cloudflare" {}

provider "github" {
  owner = "dwhswenson"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "subdomain" {
  type        = string
  description = "Subdomain for this site"
  default     = "ultrasound"
}

variable "domain" {
  type        = string
  description = "Domain for this site"
  default     = "dwhswenson.net"
}

variable "cloudflare_project_name_var_name" {
  type        = string
  description = "Name of the variable for Cloudflare project name"
  default     = "CLOUDFLARE_ASTRO_PROJECT_NAME"
}

variable "cloudflare_project_name" {
  type        = string
  description = "Name of the Cloudflare Pages project"
  default     = "ultrasound"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository for the project"
  default     = "dwhswenson/ultrasound"
}

module "cloudflare" {
  source                  = "./modules/cloudflare_pages"
  cloudflare_token_name   = "${var.cloudflare_project_name}_token"
  cloudflare_project_name = var.cloudflare_project_name
  cloudflare_account_id   = var.cloudflare_account_id
}

# TODO: remove this; used it in development, but shouldn't keep it in state
output "token" {
  value       = module.cloudflare.cloudflare_token
  description = "The Cloudflare API token with read/write access to your Cloudflare pages."
  sensitive   = true
}

output "subdomain" {
  value       = module.cloudflare.cloudflare_subdomain
  description = "The subdomain of the Cloudflare Pages project."
}

module "github" {
  source                           = "./modules/github_vars"
  github_repository                = var.github_repo
  cloudflare_project_name_var_name = var.cloudflare_project_name_var_name
  cloudflare_project_name          = var.cloudflare_project_name
  cloudflare_account_id            = var.cloudflare_account_id
  cloudflare_token                 = module.cloudflare.cloudflare_token
}

# cloudflare needs to know our custom domain
resource "cloudflare_pages_domain" "this" {
  account_id   = var.cloudflare_account_id
  project_name = var.cloudflare_project_name
  name         = "${var.subdomain}.${var.domain}"
}


# AWS stuff: get the hosted zone and create the DNS record
data "aws_route53_zone" "this" {
  name         = var.domain
  private_zone = false
}

resource "aws_route53_record" "this" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = var.subdomain
  type    = "CNAME"
  ttl     = 300
  records = [module.cloudflare.cloudflare_subdomain]
}

# cloudflare analytics token
resource "cloudflare_web_analytics_site" "main" {
  account_id = var.cloudflare_account_id
  host     = "${var.subdomain}.${var.domain}"
}

resource "github_actions_variable" "wa_token" {
  repository       = var.github_repo
  variable_name      = "CLOUDFLARE_WA_TOKEN"
  value  = cloudflare_web_analytics_site.main.site_token
}

resource "cloudflare_web_analytics_site" "preview" {
  account_id = var.cloudflare_account_id
  host       = module.cloudflare.cloudflare_subdomain
}

resource "github_actions_variable" "wa_token_preview" {
  repository       = var.github_repo
  variable_name      = "CLOUDFLARE_WA_TOKEN_PREVIEW"
  value  = cloudflare_web_analytics_site.preview.site_token
}

output "wa_token" {
  value     = cloudflare_web_analytics_site.main.site_token
  sensitive = false
}
