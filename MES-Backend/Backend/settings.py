# import os
# from pathlib import Path
# import dj_database_url


# # Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR = Path(__file__).resolve().parent.parent

 
# # Quick-start development settings - unsuitable for production
# # See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/
 
# # SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY = 'django-insecure-_0hafal#t73@!b0ori-!e(gq*l$!_9hqzr+838q1!=#g@govx0'
 
# # SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = True
 
# ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'http://localhost:8000']

 
 
# # Application definition
 
# INSTALLED_APPS = [
#     'django.contrib.admin',
#     'django.contrib.auth',
#     'django.contrib.contenttypes',
#     'django.contrib.sessions',
#     'django.contrib.messages',
#     'django.contrib.staticfiles',
#     'corsheaders',
#     'rest_framework',
#     'auth_app',
#     'Backend',

 
 
#     # 'Backend.auth_app',
#     # 'auth_app',
#     # 'auth_app.apps.AuthAppConfig'
 
# ]
 
# MIDDLEWARE = [
#     'django.middleware.security.SecurityMiddleware',
#     'django.contrib.sessions.middleware.SessionMiddleware',
#     'django.middleware.common.CommonMiddleware',
#     'django.middleware.csrf.CsrfViewMiddleware',
#     'django.contrib.auth.middleware.AuthenticationMiddleware',
#     'django.contrib.messages.middleware.MessageMiddleware',
#     'django.middleware.clickjacking.XFrameOptionsMiddleware',
#     'corsheaders.middleware.CorsMiddleware',  
 
 
# ]
 
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:4200",  # Angular development server
#     "http://mes-smart-factory.tn",


# ]
# CORS_ORIGIN_WHITELIST = [
#     'http://localhost:4200',
#     "http://mes-smart-factory.tn",

# ]
# ROOT_URLCONF = 'Backend.urls'
# # REMOVE THIS (conflicting and insecure):
# # CORS_ALLOW_ALL_ORIGINS = True
 
 
# TEMPLATES = [
#     {
#         'BACKEND': 'django.template.backends.django.DjangoTemplates',
#         'DIRS': [],
#         'APP_DIRS': True,
#         'OPTIONS': {
#             'context_processors': [
#                 'django.template.context_processors.debug',
#                 'django.template.context_processors.request',
#                 'django.contrib.auth.context_processors.auth',
#                 'django.contrib.messages.context_processors.messages',
#             ],
#         },
#     },
# ]
 
# WSGI_APPLICATION = 'Backend.wsgi.application'
 
 
# # Database
# # https://docs.djangoproject.com/en/4.2/ref/settings/#databases
 
# (Removed duplicate/mis-indented DATABASES block)
# DATABASES = {
#     'default': dj_database_url.config(
#         default=os.environ.get('postgresql://postgres_user:uJePobnIwLqdR7pSIyinrhnKDsdSzE66@dpg-d1n8bo8dl3ps7383np40-a.oregon-postgres.render.com/postgresdb_1o28')
#     )
# }

# # render database
# # DATABASES = {
# #     'default': {
# #         'ENGINE': 'django.db.backends.postgresql',
# #         'NAME': 'postgresdb_1o28',
# #         'USER': 'postgres_user',
# #         'PASSWORD': 'uJePobnIwLqdR7pSIyinrhnKDsdSzE66',
# #         'HOST': 'dpg-d1n8bo8dl3ps7383np40-a.oregon-postgres.render.com',
# #         'PORT': '5432',
# #     }
# # }




# # Password validation
# # https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators
 
# AUTH_PASSWORD_VALIDATORS = [
#     {
#         'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
#     },
# ]
 
 
# # Internationalization
# # https://docs.djangoproject.com/en/4.2/topics/i18n/
 
# LANGUAGE_CODE = 'en-us'
 
# TIME_ZONE = 'UTC'
 
# USE_I18N = True
 
# USE_TZ = True
 
 
# # Static files (CSS, JavaScript, Images)
# # https://docs.djangoproject.com/en/4.2/howto/static-files/
 
# STATIC_URL = 'static/'
 
# # Default primary key field type
# # https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field
 
# DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# AUTH_USER_MODEL = 'auth_app.User'


# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = 'smtp.gmail.com'
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True

# EMAIL_HOST_USER ='mehdiabbes02@gmail.com'
# EMAIL_HOST_PASSWORD = 'kfuh wmri gfms scyu    '

# DEFAULT_FROM_EMAIL = 'Karim Atigui <karim01atigui@gmail.com>'




# MEDIA_URL = '/media/'
# MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


import os
from pathlib import Path

# ---------------------------------------------------------
# BASE SETTINGS
# ---------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-_0hafal#t73@!b0ori-!e(gq*l$!_9hqzr+838q1!=#g@govx0'
DEBUG = True

ALLOWED_HOSTS = ['*']

# ---------------------------------------------------------
# INSTALLED APPS
# ---------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'auth_app',
    'Backend',
]

# ---------------------------------------------------------
# MIDDLEWARE
# ---------------------------------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
]

# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
]

CORS_ORIGIN_WHITELIST = [
    "http://localhost:4200",
]

# ---------------------------------------------------------
# ROOT URLS & WSGI
# ---------------------------------------------------------
ROOT_URLCONF = 'Backend.urls'
WSGI_APPLICATION = 'Backend.wsgi.application'

# ---------------------------------------------------------
# DATABASE (LOCAL POSTGRES)
# ---------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'mes_anas'),
        'USER': os.getenv('DB_USER', 'medanas'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# ---------------------------------------------------------
# PASSWORD VALIDATION
# ---------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
# ---------------------------------------------------------
# INTERNATIONALIZATION
# ---------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------
# STATIC & MEDIA
# ---------------------------------------------------------
STATIC_URL = 'static/'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ---------------------------------------------------------
# DEFAULT PK & AUTH USER
# ---------------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'auth_app.User'

# ---------------------------------------------------------
# EMAIL (LOCAL DEV / Gmail)
# ---------------------------------------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'mehdiabbes02@gmail.com'
EMAIL_HOST_PASSWORD = 'kfuh wmri gfms scyu'
DEFAULT_FROM_EMAIL = 'Mehdi Abbes <mehdiabbes02@gmail.com>'


#---------------------------------------------------------
# CACHES        
#---------------------------------------------------------

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "zum-it-cache",
    }
}
