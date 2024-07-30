FROM python:3.10

# Install dependencies
RUN pip install -U gunicorn autogenstudio
RUN pip install PyJWT pymongo

# Create the user
RUN useradd -m -u 1000 user

# Create necessary directories and set ownership
RUN mkdir -p /home/user/app/files && chown -R user:user /home/user

# Set environment variables
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    AUTOGENSTUDIO_APPDIR=/home/user/app

# Switch to the non-root user
USER user

# Set working directory
WORKDIR $HOME/app

# Copy files into the container and set ownership
COPY --chown=user:user . $HOME/app

# Start the application with gunicorn
CMD gunicorn -w $((2 * $(getconf _NPROCESSORS_ONLN) + 1)) --timeout 12600 -k uvicorn.workers.UvicornWorker autogenstudio.web.app:app --bind "0.0.0.0:8081"
