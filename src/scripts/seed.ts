/**
 * Database seed script
 * Run with: bun run src/scripts/seed.ts
 */
import 'dotenv/config';
import { db, users, faculties, departments } from '../db';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Make the first user an admin
  const [firstUser] = await db.select().from(users).limit(1);

  if (firstUser) {
    await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, firstUser.id));
    console.log(`✅ Made ${firstUser.email} an admin`);
  }

  // Create faculties
  const facultiesData = [
    {
      name: 'Facultatea de Inginerie Electrică și Știința Calculatoarelor',
      abbreviation: 'FIESC',
      description: 'Faculty of Electrical Engineering and Computer Science',
      website: 'https://fiesc.usv.ro',
      contactEmail: 'fiesc@usv.ro',
    },
    {
      name: 'Facultatea de Inginerie Mecanică, Mecatronică și Management',
      abbreviation: 'FIMMM',
      description: 'Faculty of Mechanical Engineering, Mechatronics and Management',
      website: 'https://fimmm.usv.ro',
      contactEmail: 'fimmm@usv.ro',
    },
    {
      name: 'Facultatea de Litere și Științe ale Comunicării',
      abbreviation: 'FLSC',
      description: 'Faculty of Letters and Communication Sciences',
      website: 'https://flsc.usv.ro',
      contactEmail: 'flsc@usv.ro',
    },
    {
      name: 'Facultatea de Economie, Administrație și Afaceri',
      abbreviation: 'FEAA',
      description: 'Faculty of Economics, Administration and Business',
      website: 'https://feaa.usv.ro',
      contactEmail: 'feaa@usv.ro',
    },
    {
      name: 'Facultatea de Istorie și Geografie',
      abbreviation: 'FIG',
      description: 'Faculty of History and Geography',
      website: 'https://fig.usv.ro',
      contactEmail: 'fig@usv.ro',
    },
    {
      name: 'Facultatea de Științe ale Educației',
      abbreviation: 'FSE',
      description: 'Faculty of Educational Sciences',
      website: 'https://fse.usv.ro',
      contactEmail: 'fse@usv.ro',
    },
    {
      name: 'Facultatea de Educație Fizică și Sport',
      abbreviation: 'FEFS',
      description: 'Faculty of Physical Education and Sport',
      website: 'https://fefs.usv.ro',
      contactEmail: 'fefs@usv.ro',
    },
    {
      name: 'Facultatea de Silvicultură',
      abbreviation: 'FS',
      description: 'Faculty of Forestry',
      website: 'https://fs.usv.ro',
      contactEmail: 'fs@usv.ro',
    },
    {
      name: 'Facultatea de Științe ale Naturii și Alimentație',
      abbreviation: 'FSNA',
      description: 'Faculty of Food Engineering',
      website: 'https://fsna.usv.ro',
      contactEmail: 'fsna@usv.ro',
    },
  ];

  for (const faculty of facultiesData) {
    try {
      const [created] = await db
        .insert(faculties)
        .values(faculty)
        .onConflictDoNothing()
        .returning();

      if (created) {
        console.log(`✅ Created faculty: ${faculty.abbreviation}`);
      } else {
        console.log(`⏭️  Faculty already exists: ${faculty.abbreviation}`);
      }
    } catch (error) {
      console.log(`⏭️  Faculty already exists: ${faculty.abbreviation}`);
    }
  }

  // Create departments for FIESC
  const [fiesc] = await db
    .select()
    .from(faculties)
    .where(eq(faculties.abbreviation, 'FIESC'))
    .limit(1);

  if (fiesc) {
    const departmentsData = [
      {
        name: 'Departamentul de Calculatoare',
        facultyId: fiesc.id,
        description: 'Department of Computers',
      },
      {
        name: 'Departamentul de Electronică și Telecomunicații',
        facultyId: fiesc.id,
        description: 'Department of Electronics and Telecommunications',
      },
      {
        name: 'Departamentul de Energetică',
        facultyId: fiesc.id,
        description: 'Department of Power Engineering',
      },
    ];

    for (const dept of departmentsData) {
      try {
        const [created] = await db
          .insert(departments)
          .values(dept)
          .onConflictDoNothing()
          .returning();

        if (created) {
          console.log(`✅ Created department: ${dept.name}`);
        } else {
          console.log(`⏭️  Department already exists: ${dept.name}`);
        }
      } catch (error) {
        console.log(`⏭️  Department already exists: ${dept.name}`);
      }
    }
  }

  console.log('\n✨ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

