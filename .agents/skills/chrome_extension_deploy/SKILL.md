---
name: Chrome Extension GitHub Deploy
description: Tự động hóa quy trình đóng gói và upload/deploy Chrome Extension lên Chrome Web Store thông qua GitHub Actions.
---

# Hướng dẫn Deploy Chrome Extension qua GitHub Actions

Tài liệu này hướng dẫn cách cấu hình quy trình CI/CD tự động đóng gói và tải tiện ích mở rộng lên Chrome Web Store mỗi khi có code mới trên GitHub.

## Bước 1: Chuẩn bị thông tin API từ Google Cloud Console

Để cho phép GitHub Actions truy cập vào tài khoản nhà phát triển Chrome của bạn, bạn cần tạo OAuth credentials:

1. Truy cập vào [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo một dự án mới (hoặc chọn một dự án có sẵn).
3. Đi tới **APIs & Services** > **Credentials**.
4. Nhấn **Create Credentials** và chọn **OAuth client ID**.
5. Chọn Application type là **Desktop app** (Ứng dụng trên máy tính). Đặt tên bất kỳ và nhấn **Create**.
6. Bạn sẽ nhận được **Client ID** và **Client Secret**. Hãy lưu lại chúng.

## Bước 2: Lấy Refresh Token

Bạn cần một `Refresh Token` để xác thực với Google mà không cần đăng nhập lại:

1. Cài đặt công cụ hỗ trợ lấy token bằng Node.js trên máy local của bạn:
   ```bash
   npx webstore-upload-cli@latest token
   ```
2. Công cụ sẽ hiển thị một đường link và tự động mở trình duyệt để yêu cầu bạn đăng nhập bằng tài khoản Google quản lý Chrome Web Store Developer.
3. Sau khi bạn đồng ý cấp quyền, trình duyệt sẽ chuyển hướng và hiển thị mã **Refresh Token** trên màn hình Terminal. Hãy lưu lại mã này.

## Bước 3: Cấu hình Secrets trên GitHub Repository

Vào dự án của bạn trên GitHub, truy cập **Settings** > **Secrets and variables** > **Actions** > Nhấp vào **New repository secret** để thêm 4 biến bảo mật sau:

* `CHROME_EXTENSION_ID`: ID của tiện ích trên Chrome Web Store (lấy từ Developer Console sau khi tải lên bản đầu tiên).
* `CHROME_CLIENT_ID`: Lấy ở Bước 1.
* `CHROME_CLIENT_SECRET`: Lấy ở Bước 1.
* `CHROME_REFRESH_TOKEN`: Lấy ở Bước 2.

## Bước 4: Tạo file Workflow GitHub Actions

Tạo một file cấu hình tại đường dẫn `.github/workflows/deploy.yml` trong dự án của bạn với nội dung sau:

```yaml
name: Deploy Chrome Extension

on:
  push:
    tags:
      - 'v*' # Chạy khi bạn push một tag phiên bản (ví dụ: v1.0.0)
  # Hoặc bạn có thể chọn chạy mỗi khi push lên nhánh main:
  # push:
  #   branches:
  #     - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build zip package
        run: |
          # Loại bỏ các file không cần thiết trước khi đóng gói
          zip -r extension.zip . -x "*.git*" "*.github*" "suno-helper.zip" "README.md"

      - name: Upload & Publish to Chrome Web Store
        uses: passmarked/chrome-webstore-upload-action@v1.2.0
        with:
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
          extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
          # Mặc định action này sẽ tự động publish (gửi duyệt) tiện ích.
```
