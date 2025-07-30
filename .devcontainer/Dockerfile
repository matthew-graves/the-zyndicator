# See https://github.com/microsoft/vscode-dev-containers for base images
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:16

# Install additional Linux packages if needed
RUN apt-get update && \
    apt-get install -y \
      libopencv-dev \
      python3 \
      python3-pip && \
    rm -rf /var/lib/apt/lists/*

# (Optional) Install Tesseract CLI for testing
RUN apt-get update && apt-get install -y tesseract-ocr && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER node