import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM categories ORDER BY sort_order ASC",
    );
    const formattedRows = rows.map((row: any) => ({
      ...row,
      id: Number(row.id)
    }));
    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: `Internal server error ${error}` },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, sort_order } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [result]: any = await pool.query(
      "INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)",
      [name, description, sort_order || 0],
    );

    return NextResponse.json(
      { id: Number(result.insertId), name, description, sort_order },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 },
      );
    }
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
