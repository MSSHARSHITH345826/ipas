# SSL/HTTPS Configuration Guide for IPAS Frontend

This guide explains how to configure SSL certificates for the IPAS frontend application in different environments.

## Table of Contents
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Certificate Generation](#certificate-generation)
- [Troubleshooting](#troubleshooting)

---

## Development Environment

### Option 1: Using React Scripts (npm start)

1. **Create a `.env` file** in the `ipas-frontend/` directory:
   ```bash
   cp .env.example .env
   ```

2. **Configure SSL paths** in `.env`:
   ```env
   HTTPS=true
   SSL_CRT_FILE=./certs/certificate.pem
   SSL_KEY_FILE=./certs/private-key.pem
   PORT=3000
   ```

3. **Place your certificates** in the `ipas-frontend/certs/` directory:
   ```
   ipas-frontend/
   ├── certs/
   │   ├── certificate.pem
   │   └── private-key.pem
   └── .env
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```
   
   Access your app at: `https://localhost:3000`

### Option 2: Generate Self-Signed Certificate (Development Only)

For local development, you can generate a self-signed certificate:

**Windows (PowerShell):**
```powershell
# Create certs directory
New-Item -ItemType Directory -Force -Path certs

# Generate self-signed certificate
$cert = New-SelfSignedCertificate `
    -Subject "CN=localhost" `
    -DnsName "localhost", "127.0.0.1" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotAfter (Get-Date).AddYears(1) `
    -CertStoreLocation "Cert:\CurrentUser\My"

# Export certificate
$certPath = "certs\certificate.pem"
$keyPath = "certs\private-key.pem"

Export-Certificate -Cert $cert -FilePath $certPath -Type CERT
Export-PfxCertificate -Cert $cert -FilePath "certs\temp.pfx" -Password (ConvertTo-SecureString -String "temp" -Force -AsPlainText)

# Convert to PEM (requires OpenSSL)
openssl pkcs12 -in certs/temp.pfx -nocerts -out $keyPath -nodes -passin pass:temp
openssl pkcs12 -in certs/temp.pfx -clcerts -nokeys -out $certPath -passin pass:temp

Remove-Item "certs\temp.pfx"
```

**Linux/Mac:**
```bash
# Create certs directory
mkdir -p certs

# Generate self-signed certificate
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/private-key.pem \
  -out certs/certificate.pem \
  -days 365 \
  -subj "/CN=localhost"
```

---

## Production Environment

### Option 1: Using Node.js HTTPS Server (server.js)

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Configure environment variables**:
   ```env
   HTTPS=true
   SSL_CRT_FILE=/path/to/production/certificate.pem
   SSL_KEY_FILE=/path/to/production/private-key.pem
   PORT=443
   ```

3. **Run the production server**:
   ```bash
   npm run serve:production
   ```

### Option 2: Using Nginx (Recommended for Production)

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Configure Nginx** (`/etc/nginx/sites-available/ipas`):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       # SSL Configuration
       ssl_certificate /etc/ssl/certs/your-certificate.pem;
       ssl_certificate_key /etc/ssl/private/your-private-key.pem;
       
       # SSL Security Settings
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
       ssl_prefer_server_ciphers off;
       
       # HSTS
       add_header Strict-Transport-Security "max-age=63072000" always;

       # Application files
       root /var/www/ipas/build;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Optional: Proxy to backend API
       location /api {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable the site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ipas /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Option 3: Using Apache

1. **Enable SSL module**:
   ```bash
   sudo a2enmod ssl
   sudo a2enmod rewrite
   ```

2. **Configure Apache** (`/etc/apache2/sites-available/ipas-ssl.conf`):
   ```apache
   <VirtualHost *:443>
       ServerName your-domain.com
       DocumentRoot /var/www/ipas/build

       SSLEngine on
       SSLCertificateFile /etc/ssl/certs/your-certificate.pem
       SSLCertificateKeyFile /etc/ssl/private/your-private-key.pem
       
       <Directory /var/www/ipas/build>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
           
           # Handle React Router
           RewriteEngine On
           RewriteBase /
           RewriteRule ^index\.html$ - [L]
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule . /index.html [L]
       </Directory>
   </VirtualHost>
   ```

3. **Enable the site**:
   ```bash
   sudo a2ensite ipas-ssl
   sudo systemctl reload apache2
   ```

### Option 4: Cloud Deployment

#### AWS (with CloudFront)
1. Upload build files to S3
2. Create CloudFront distribution
3. Use AWS Certificate Manager (ACM) for SSL
4. Point domain to CloudFront

#### Azure (App Service)
1. Deploy build to Azure App Service
2. Configure custom domain
3. Enable managed certificate or upload your own
4. Configure in Azure Portal → App Service → TLS/SSL settings

#### Google Cloud Platform
1. Deploy to Cloud Storage or App Engine
2. Use Google-managed SSL certificates
3. Configure in Cloud Load Balancer

---

## Certificate Generation

### Getting Production Certificates

#### Option 1: Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# For Nginx
sudo certbot --nginx -d your-domain.com

# For Apache
sudo certbot --apache -d your-domain.com
```

#### Option 2: Commercial SSL (Recommended for Enterprise)
Purchase from:
- DigiCert
- Sectigo
- GlobalSign
- GoDaddy

### Certificate Files You'll Need
- **Certificate file** (`.pem`, `.crt`): Public certificate
- **Private key file** (`.key`, `.pem`): Private key (keep secure!)
- **CA bundle** (optional): Intermediate certificates
- **Full chain** (recommended): Certificate + CA bundle

---

## Troubleshooting

### Common Issues

#### 1. "Certificate not found" Error
- Verify file paths in `.env` are correct
- Check file permissions (should be readable)
- Use absolute paths if relative paths fail

#### 2. "Certificate not trusted" Warning in Browser
- For development: Normal with self-signed certificates
- For production: Ensure certificate is from a trusted CA
- Import self-signed certificate to system trust store (dev only)

#### 3. Port 443 Permission Denied
```bash
# Linux: Allow Node.js to bind to privileged ports
sudo setcap 'cap_net_bind_service=+ep' $(which node)

# Or use port forwarding
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --target-port 3000
```

#### 4. Mixed Content Warnings
- Ensure all API URLs use HTTPS in production
- Update `.env` file:
  ```env
  REACT_APP_API_URL=https://api.your-domain.com
  ```

### Security Best Practices

1. **Never commit certificates to Git**
   - Add to `.gitignore`: `.env`, `certs/`, `*.pem`, `*.key`

2. **Use environment-specific certificates**
   - Development: Self-signed or development CA
   - Production: Trusted CA certificate

3. **Keep private keys secure**
   - Restrict file permissions: `chmod 600 private-key.pem`
   - Use secret management (AWS Secrets Manager, Azure Key Vault)

4. **Regular certificate renewal**
   - Set up auto-renewal for Let's Encrypt
   - Monitor certificate expiration dates

5. **Use strong SSL/TLS configuration**
   - Disable old protocols (SSLv3, TLS 1.0, TLS 1.1)
   - Use strong ciphers
   - Enable HSTS

---

## Quick Reference

### Development
```bash
# Start with HTTPS
HTTPS=true npm start

# Or configure in .env
echo "HTTPS=true" >> .env
npm start
```

### Production
```bash
# Build
npm run build

# Serve with Node.js
npm run serve:production

# Or use static file server
serve -s build --ssl-cert path/to/cert.pem --ssl-key path/to/key.pem
```

### Check Certificate
```bash
# View certificate details
openssl x509 -in certificate.pem -text -noout

# Test HTTPS connection
curl -I https://localhost:3000

# Check certificate expiration
openssl x509 -in certificate.pem -noout -enddate
```

---

## Support

For additional help:
- Check React Scripts HTTPS documentation
- Consult your hosting provider's SSL setup guide
- Contact your system administrator for production certificate management

