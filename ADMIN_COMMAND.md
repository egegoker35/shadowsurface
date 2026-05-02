# Admin Olma Komutu

DigitalOcean Console'a gir ve çalıştır:

```bash
npx prisma db execute --url="$DATABASE_URL" --stdin <<< "UPDATE \"User\" SET role = 'admin' WHERE email = 'SENIN_EMAILIN@gmail.com';"
```

`SENIN_EMAILIN@gmail.com` yerine kendi email adresini yaz.

Sonra siteye git: https://seninsiten.com/admin
