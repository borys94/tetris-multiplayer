output "instance_id" {
  value = aws_instance.server.id
}

output "public_ip" {
  value = aws_eip.server.public_ip
}

output "beta_url" {
  value = "https://beta.${aws_eip.server.public_ip}.sslip.io"
}

output "prod_url" {
  value = "https://${aws_eip.server.public_ip}.sslip.io"
}
