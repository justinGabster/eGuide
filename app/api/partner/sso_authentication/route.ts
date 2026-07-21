import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Exact mock response payload provided by the user to guarantee demo success
  return NextResponse.json({
    "status": 200,
    "message": "OK",
    "data": {
      "uniqid": "MVPCBEUVCGPZR",
      "email": "josie@yopmail.com",
      "birth_date": "1990-01-01",
      "first_name": "JOSIE",
      "middle_name": "SANTOS",
      "last_name": "DELA CRUZ",
      "suffix": null,
      "gender": "female",
      "nationality": "Filipino",
      "photo": "https://staging-files.oueg.info/staging/9e2be7f8-9853-43a2-8b8b-a216a3585951.png",
      "mobile": "+639090000000",
      "address": "1123 RIZAL ST., POBLACION, CITY OF ALAMINOS, PANGASINAN, PHILIPPINES",
      "street": "1123 RIZAL ST.",
      "barangay": "POBLACION",
      "municipality": "CITY OF ALAMINOS",
      "region": "REGION I (ILOCOS REGION)",
      "province": "PANGASINAN",
      "country": "Philippines",
      "country_alpha_2_code": "PH",
      "country_alpha_3_code": "PHL",
      "postal": null,
      "address_line_2": null,
      "barangay_code": "0105503021",
      "province_code": "0105500000",
      "municipality_code": "0105503000",
      "region_code": "0100000000",
      "country_id": 175,
      "foreign_address": null,
      "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "signature_url": "https://egov-stg.s3.ap-southeast-1.amazonaws.com/tmp/signatures/zgy3rLuiH6JlUYJI.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAZWODBTF4Y7BXD5PN%2F20260707%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20260707T041319Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Signature=fd22afc50e85f59ace23bece0c2f625da8de4fb1769b9928a28a0883084136e0",
      "additional_information": {
        "health_data": {
          "weight": "55",
          "height": "168",
          "eyes_color": "Black",
          "complexion": "WHITE"
        },
        "birth_place": {
          "birth_country": "Philippines",
          "birth_province": "PANGASINAN",
          "birth_municipality": "CITY OF ALAMINOS"
        },
        "other_personal_information": {
          "marital_status": "Single",
          "religion": "N/A"
        },
        "mother_details": {
          "mother_maiden_lastname": "SANTOS",
          "mother_maiden_firstname": "MARIE",
          "mother_maiden_middlename": "GARCIA",
          "mother_birthdate": "2021-03-18"
        },
        "father_details": {
          "father_lastname": "N/A",
          "father_firstname": "N/A",
          "father_birthdate": "1978-10-09"
        },
        "emergency_information": {
          "emergency_name": "MARK DELA CRUZ",
          "emergency_contact": "+63 9090000010",
          "emergency_relationship": "Parent"
        },
        "industry": {
          "industry": "Professional, Scientific and Technical Activities"
        },
        "occupation": {
          "occupation": "Software And Applications Developers And Analyst Not Elsewhere Classified"
        },
        "expected_salary": {
          "expected_salary": "130,001-180,000"
        },
        "educational_attainment": [
          {
            "level": "Master",
            "school": "AMA Computer College-Pangasinan",
            "from": "2008",
            "educational_background": "INFORMATION TECHNOLOGY",
            "to": "2012"
          }
        ]
      },
      "passport": {
        "first_name": "Josie",
        "middle_name": "SANTOS",
        "last_name": "Dela Cruz",
        "suffix": null,
        "gender": "female",
        "birth_date": "1990-01-01",
        "passport_number": "PN1234567",
        "place_issued": "Philippines",
        "issued_date": "2023-08-29",
        "expiry_date": "2030-08-29"
      },
      "national_id": {
        "code": "XXX001",
        "pcn": "9639954762664080",
        "face_url": "https://egov-cdn-stg.oueg.info/uploads/profile_merchants/7c0976e2-a60f-46eb-a97a-999e60e0a1eb",
        "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      },
      "tin_id": null
    }
  });
}
