export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, eligibilityConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  evaluateEligibility,
  loadEligibilityConfig,
  calculateAge,
} from "@/lib/eligibility/engine";

export async function POST(req: NextRequest) {
  try {
    const CORE_KEYS = new Set([
      "locale", "fullName", "email", "phone", "country",
      "dateOfBirth", "vocationalTrainingCompleted", "interestedInField",
    ]);

    const body = (await req.json()) as {
      locale: string;
      fullName: string;
      email: string;
      phone: string;
      country: string;
      dateOfBirth: string;
      vocationalTrainingCompleted: boolean;
      interestedInField: boolean;
      extraResponses?: Record<string, string>;
    };

    const rawConfig = db
      .select()
      .from(eligibilityConfig)
      .where(eq(eligibilityConfig.id, 1))
      .get();

    if (!rawConfig) {
      return NextResponse.json(
        { error: "Eligibility configuration not found" },
        { status: 500 }
      );
    }

    const config = loadEligibilityConfig(rawConfig);
    const result = evaluateEligibility(
      {
        country: body.country,
        dateOfBirth: body.dateOfBirth,
        vocationalTrainingCompleted: body.vocationalTrainingCompleted,
        interestedInField: body.interestedInField,
      },
      config
    );

    const id = uuidv4();
    const now = new Date().toISOString();
    const age = calculateAge(body.dateOfBirth, new Date());

    const extraJson = body.extraResponses && Object.keys(body.extraResponses).length > 0
      ? JSON.stringify(body.extraResponses)
      : null;

    db.insert(submissions)
      .values({
        id,
        locale: body.locale,
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        country: body.country,
        dateOfBirth: body.dateOfBirth,
        ageAtSubmission: age,
        vocationalTrainingCompleted: body.vocationalTrainingCompleted ? 1 : 0,
        interestedInField: body.interestedInField ? 1 : 0,
        eligibilityStatus: result.passed ? "passed" : "rejected",
        rejectionReasonKey: result.passed ? null : result.reasonKey,
        rejectionReasonDetails: result.passed
          ? null
          : JSON.stringify(result.reasonDetails),
        paymentStatus: "pending",
        extraResponses: extraJson,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    if (result.passed) {
      return NextResponse.json({ passed: true, partialSubmissionId: id });
    } else {
      return NextResponse.json({
        passed: false,
        reasonKey: result.reasonKey,
        reasonDetails: result.reasonDetails,
      });
    }
  } catch (err) {
    console.error("[api/screen]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
