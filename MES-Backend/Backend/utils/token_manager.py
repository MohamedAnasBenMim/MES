import requests
from django.http import JsonResponse

cached_token = None


def get_mingle_token():
    global cached_token

    # ------------------------------------------------------------------
    # 1️⃣ Fetch all IONAPI credentials only once
    # ------------------------------------------------------------------
    try:
        cred_response = requests.get('http://127.0.0.1:8000/api/get_ionapi_credential/')
        cred_response.raise_for_status()
        creds = cred_response.json()
    except Exception as e:
        print(f"❌ Failed to load IONAPI credentials: {e}")
        raise

    # Extract values safely
    pu = creds.get('pu')
    ot = creds.get('ot')
    ci = creds.get('ci')
    cs = creds.get('cs')
    ev = creds.get('ev')
    iu = creds.get('iu')

    # ------------------------------------------------------------------
    # 2️⃣ Build token URL and credentials dynamically
    # ------------------------------------------------------------------
    token_url = f"{pu}{ot}"
    client_id = ci
    client_secret = cs

    # Username & password come directly from ionapi file
    data = {
        "grant_type": "password",
        "username": "LDE4VNS7C63W3JGC_DEM#MiEcMbq0duOOTfig-ZWlxpa574cFd9qJTVjXGIMj4oaR9JqEHHcacqgLln3AFDNn9uGe6wcgPuGWklHsQS-sdQ",
        "password": "ko5kvCJK_KD6Q0AimIFF0jO-OiKtatOZZF-qtavcTA-vG9Euc7eEcSfcV-tLJNo_eh45wybj-_vTwciSxI_sCw"
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    # ------------------------------------------------------------------
    # 3️⃣ Request the token
    # ------------------------------------------------------------------
    try:
        response = requests.post(
            url=token_url,
            headers=headers,
            data=data,
            auth=(client_id, client_secret)
        )
        response.raise_for_status()

        token = response.json().get("access_token")
        cached_token = token

        return token

    except Exception as e:
        print(f"❌ Token fetch failed: {e}")
        raise
