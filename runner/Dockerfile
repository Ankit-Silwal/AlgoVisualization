FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 gcc libc6-dev openjdk-17-jdk-headless && rm -rf /var/lib/apt/lists/*
COPY runner.py /opt/runner.py
WORKDIR /work
USER 65534:65534
ENTRYPOINT ["python3", "/opt/runner.py"]
