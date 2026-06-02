// database/seed.js
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

let pool = null;

async function seedDatabase() {
  try {
    const dbName = process.env.DB_NAME || 'students_management';
    
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: dbName,
    });
    
    const client = await pool.connect();
    
    try {
      console.log('🟡 Starting database seeding...');
      
      await client.query('BEGIN');
      
      // ============================================
      // 1. SEED USERS
      // ============================================
      console.log('🟡 Seeding users...');
      
      const users = [
        {
          name: 'Super Admin',
          email: 'admin@studentsys.com',
          password: await bcrypt.hash('password123', 10),
          role: 'super_admin'
        },
        {
          name: 'John Doe',
          email: 'john.doe@studentsys.com',
          password: await bcrypt.hash('password123', 10),
          role: 'admin'
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@studentsys.com',
          password: await bcrypt.hash('password123', 10),
          role: 'teacher'
        },
        {
          name: 'Mike Johnson',
          email: 'mike.johnson@studentsys.com',
          password: await bcrypt.hash('password123', 10),
          role: 'librarian'
        },
        {
          name: 'Sarah Williams',
          email: 'sarah.williams@studentsys.com',
          password: await bcrypt.hash('password123', 10),
          role: 'hr_manager'
        }
      ];
      
      for (const user of users) {
        // Check if user exists
        const existing = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [user.email]
        );
        
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO users (name, email, password, role) 
             VALUES ($1, $2, $3, $4)`,
            [user.name, user.email, user.password, user.role]
          );
        }
      }
      console.log(`✅ Seeded ${users.length} users`);
      
      // ============================================
      // 2. SEED STUDENTS
      // ============================================
      console.log('🟡 Seeding students...');
      
      const students = [
        {
          admission_number: '2024001',
          name: 'Alice Kamau',
          email: 'alice.kamau@student.com',
          phone: '0712345678',
          address: '123 Nairobi Street',
          date_of_birth: '2010-05-15',
          gender: 'Female',
          class: 'Form 1A',
          parent_name: 'John Kamau',
          parent_phone: '0723456789',
          status: 'active'
        },
        {
          admission_number: '2024002',
          name: 'Brian Omondi',
          email: 'brian.omondi@student.com',
          phone: '0723456789',
          address: '456 Kisumu Road',
          date_of_birth: '2010-08-22',
          gender: 'Male',
          class: 'Form 1A',
          parent_name: 'Peter Omondi',
          parent_phone: '0734567890',
          status: 'active'
        },
        {
          admission_number: '2024003',
          name: 'Catherine Muthoni',
          email: 'catherine.muthoni@student.com',
          phone: '0734567890',
          address: '789 Nakuru Ave',
          date_of_birth: '2010-03-10',
          gender: 'Female',
          class: 'Form 1B',
          parent_name: 'Mary Muthoni',
          parent_phone: '0745678901',
          status: 'active'
        },
        {
          admission_number: '2024004',
          name: 'David Kiplagat',
          email: 'david.kiplagat@student.com',
          phone: '0745678901',
          address: '321 Eldoret Town',
          date_of_birth: '2009-11-30',
          gender: 'Male',
          class: 'Form 2A',
          parent_name: 'Joseph Kiplagat',
          parent_phone: '0756789012',
          status: 'active'
        },
        {
          admission_number: '2024005',
          name: 'Esther Wanjiku',
          email: 'esther.wanjiku@student.com',
          phone: '0756789012',
          address: '654 Thika Road',
          date_of_birth: '2009-07-18',
          gender: 'Female',
          class: 'Form 2B',
          parent_name: 'James Wanjiku',
          parent_phone: '0767890123',
          status: 'active'
        }
      ];
      
      for (const student of students) {
        const existing = await client.query(
          'SELECT id FROM students WHERE admission_number = $1',
          [student.admission_number]
        );
        
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO students (admission_number, name, email, phone, address, 
             date_of_birth, gender, class, parent_name, parent_phone, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [student.admission_number, student.name, student.email, student.phone, 
             student.address, student.date_of_birth, student.gender, student.class,
             student.parent_name, student.parent_phone, student.status]
          );
        }
      }
      console.log(`✅ Seeded ${students.length} students`);
      
      // ============================================
      // 3. SEED BOOKS
      // ============================================
      console.log('🟡 Seeding books...');
      
      const books = [
        {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          isbn: '9780743273565',
          category: 'Fiction',
          publisher: 'Scribner',
          publication_year: 1925,
          total_copies: 5,
          available_copies: 5,
          description: 'A classic novel about the Jazz Age',
          location: 'Section A, Shelf 1'
        },
        {
          title: 'To Kill a Mockingbird',
          author: 'Harper Lee',
          isbn: '9780061120084',
          category: 'Fiction',
          publisher: 'HarperCollins',
          publication_year: 1960,
          total_copies: 8,
          available_copies: 8,
          description: 'A novel about racial injustice',
          location: 'Section A, Shelf 2'
        },
        {
          title: '1984',
          author: 'George Orwell',
          isbn: '9780452284234',
          category: 'Science Fiction',
          publisher: 'Signet Classics',
          publication_year: 1949,
          total_copies: 6,
          available_copies: 6,
          description: 'Dystopian social science fiction',
          location: 'Section B, Shelf 1'
        },
        {
          title: 'Pride and Prejudice',
          author: 'Jane Austen',
          isbn: '9780141439518',
          category: 'Romance',
          publisher: 'Penguin Classics',
          publication_year: 1813,
          total_copies: 4,
          available_copies: 4,
          description: 'A classic romance novel',
          location: 'Section B, Shelf 2'
        },
        {
          title: 'The Catcher in the Rye',
          author: 'J.D. Salinger',
          isbn: '9780316769480',
          category: 'Fiction',
          publisher: 'Little, Brown and Company',
          publication_year: 1951,
          total_copies: 7,
          available_copies: 7,
          description: 'A story about teenage rebellion',
          location: 'Section C, Shelf 1'
        }
      ];
      
      for (const book of books) {
        const existing = await client.query(
          'SELECT id FROM books WHERE isbn = $1',
          [book.isbn]
        );
        
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO books (title, author, isbn, category, publisher, 
             publication_year, total_copies, available_copies, description, location)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [book.title, book.author, book.isbn, book.category, book.publisher,
             book.publication_year, book.total_copies, book.available_copies, 
             book.description, book.location]
          );
        }
      }
      console.log(`✅ Seeded ${books.length} books`);
      
      // ============================================
      // 4. SEED EMPLOYEES
      // ============================================
      console.log('🟡 Seeding employees...');
      
      // Get department IDs
      const deptResult = await client.query('SELECT id, name FROM departments');
      const deptMap = {};
      deptResult.rows.forEach(row => {
        deptMap[row.name] = row.id;
      });
      
      const employees = [
        {
          employee_id: 'EMP001',
          name: 'Dr. James Maina',
          email: 'james.maina@studentsys.com',
          phone: '0712345678',
          position: 'Principal',
          department_id: deptMap['Administration'],
          hire_date: '2015-01-15',
          salary: 250000,
          status: 'active'
        },
        {
          employee_id: 'EMP002',
          name: 'Prof. Mary Wanjiku',
          email: 'mary.wanjiku@studentsys.com',
          phone: '0723456789',
          position: 'Deputy Principal - Academics',
          department_id: deptMap['Academic'],
          hire_date: '2016-03-20',
          salary: 200000,
          status: 'active'
        },
        {
          employee_id: 'EMP003',
          name: 'Mr. Peter Ochieng',
          email: 'peter.ochieng@studentsys.com',
          phone: '0734567890',
          position: 'Finance Manager',
          department_id: deptMap['Finance'],
          hire_date: '2018-06-10',
          salary: 150000,
          status: 'active'
        },
        {
          employee_id: 'EMP004',
          name: 'Ms. Sarah Kimani',
          email: 'sarah.kimani@studentsys.com',
          phone: '0745678901',
          position: 'ICT Director',
          department_id: deptMap['ICT'],
          hire_date: '2019-01-05',
          salary: 120000,
          status: 'active'
        },
        {
          employee_id: 'EMP005',
          name: 'Mr. Joseph Ndirangu',
          email: 'joseph.ndirangu@studentsys.com',
          phone: '0756789012',
          position: 'Transport Manager',
          department_id: deptMap['Transport'],
          hire_date: '2020-08-15',
          salary: 90000,
          status: 'active'
        }
      ];
      
      for (const employee of employees) {
        const existing = await client.query(
          'SELECT id FROM employees WHERE employee_id = $1',
          [employee.employee_id]
        );
        
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO employees (employee_id, name, email, phone, position, 
             department_id, hire_date, salary, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [employee.employee_id, employee.name, employee.email, employee.phone,
             employee.position, employee.department_id, employee.hire_date,
             employee.salary, employee.status]
          );
        }
      }
      console.log(`✅ Seeded ${employees.length} employees`);
      
      // ============================================
      // 5. SEED SUPPLIERS
      // ============================================
      console.log('🟡 Seeding suppliers...');
      
      const suppliers = [
        {
          name: 'Elite Stationers Ltd',
          contact_person: 'John Mwangi',
          email: 'orders@elitestationers.com',
          phone: '0712345678',
          address: '123 Industrial Area, Nairobi',
          tax_id: 'P051234567Z',
          payment_terms: '30',
          category: 'Stationery'
        },
        {
          name: 'Tech Solutions Kenya',
          contact_person: 'Alice Njeri',
          email: 'sales@techsolutions.co.ke',
          phone: '0723456789',
          address: '456 Westlands, Nairobi',
          tax_id: 'P051234568Z',
          payment_terms: '45',
          category: 'Electronics'
        },
        {
          name: 'Book World Publishers',
          contact_person: 'George Otieno',
          email: 'info@bookworld.com',
          phone: '0734567890',
          address: '789 CBD, Nairobi',
          tax_id: 'P051234569Z',
          payment_terms: '60',
          category: 'Books'
        }
      ];
      
      for (const supplier of suppliers) {
        // Check if supplier exists by name or email
        const existing = await client.query(
          'SELECT id FROM suppliers WHERE name = $1 OR email = $2',
          [supplier.name, supplier.email]
        );
        
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO suppliers (name, contact_person, email, phone, address, 
             tax_id, payment_terms, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [supplier.name, supplier.contact_person, supplier.email, supplier.phone,
             supplier.address, supplier.tax_id, supplier.payment_terms, supplier.category]
          );
        }
      }
      console.log(`✅ Seeded ${suppliers.length} suppliers`);
      
      // ============================================
      // 6. SEED STOCK ITEMS
      // ============================================
      console.log('🟡 Seeding stock items...');
      
      const stockItems = [
        {
          sku: 'ST001',
          name: 'A4 Copy Paper',
          category: 'Stationery',
          quantity: 500,
          unit: 'reams',
          unit_price: 350,
          reorder_level: 100,
          description: 'White A4 paper, 500 sheets',
          location: 'Warehouse A, Shelf 1'
        },
        {
          sku: 'ST002',
          name: 'Whiteboard Markers',
          category: 'Stationery',
          quantity: 200,
          unit: 'pieces',
          unit_price: 120,
          reorder_level: 50,
          description: 'Dry erase markers, assorted colors',
          location: 'Warehouse A, Shelf 2'
        },
        {
          sku: 'ST003',
          name: 'Laptop Computers',
          category: 'Electronics',
          quantity: 50,
          unit: 'units',
          unit_price: 45000,
          reorder_level: 10,
          description: '15-inch laptops, 8GB RAM, 256GB SSD',
          location: 'ICT Store, Rack 1'
        }
      ];
      
      for (const item of stockItems) {
        const existing = await client.query(
          'SELECT id FROM stock_items WHERE sku = $1',
          [item.sku]
        );
        
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO stock_items (sku, name, category, quantity, unit, 
             unit_price, reorder_level, description, location)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [item.sku, item.name, item.category, item.quantity, item.unit,
             item.unit_price, item.reorder_level, item.description, item.location]
          );
        }
      }
      console.log(`✅ Seeded ${stockItems.length} stock items`);
      
      // ============================================
      // 7. SEED VEHICLES
      // ============================================
      console.log('🟡 Seeding vehicles...');
      
      const vehicles = [
        {
          registration_number: 'KCA 001A',
          model: 'Toyota Hiace',
          capacity: 14,
          driver_name: 'John Kamau',
          driver_phone: '0712345678',
          status: 'active'
        },
        {
          registration_number: 'KCB 002B',
          model: 'Isuzu Bus',
          capacity: 60,
          driver_name: 'Peter Omondi',
          driver_phone: '0723456789',
          status: 'active'
        },
        {
          registration_number: 'KCC 003C',
          model: 'Mitsubishi Canter',
          capacity: 25,
          driver_name: 'James Mwangi',
          driver_phone: '0734567890',
          status: 'maintenance'
        }
      ];
      
      for (const vehicle of vehicles) {
        const existing = await client.query(
          'SELECT id FROM vehicles WHERE registration_number = $1',
          [vehicle.registration_number]
        );
        
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO vehicles (registration_number, model, capacity, 
             driver_name, driver_phone, status)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [vehicle.registration_number, vehicle.model, vehicle.capacity,
             vehicle.driver_name, vehicle.driver_phone, vehicle.status]
          );
        }
      }
      console.log(`✅ Seeded ${vehicles.length} vehicles`);
      
      // ============================================
      // 8. SEED ROUTES
      // ============================================
      console.log('🟡 Seeding routes...');
      
      const routes = [
        {
          name: 'Route A - Nairobi CBD',
          start_point: 'School',
          end_point: 'City Centre',
          distance: 15.5,
          duration: 45
        },
        {
          name: 'Route B - Westlands',
          start_point: 'School',
          end_point: 'Westlands',
          distance: 12.3,
          duration: 35
        },
        {
          name: 'Route C - Eastlands',
          start_point: 'School',
          end_point: 'Eastlands',
          distance: 18.7,
          duration: 55
        }
      ];
      
      for (const route of routes) {
        const existing = await client.query(
          'SELECT id FROM routes WHERE name = $1',
          [route.name]
        );
        
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO routes (name, start_point, end_point, distance, duration)
             VALUES ($1, $2, $3, $4, $5)`,
            [route.name, route.start_point, route.end_point, route.distance, route.duration]
          );
        }
      }
      console.log(`✅ Seeded ${routes.length} routes`);
      
      // ============================================
      // 9. SEED ASSETS
      // ============================================
      console.log('🟡 Seeding assets...');
      
      const assets = [
        {
          asset_tag: 'AST001',
          name: 'Dell Laptop',
          category: 'ICT Equipment',
          purchase_date: '2023-01-15',
          purchase_cost: 65000,
          current_value: 55000,
          location: 'ICT Lab',
          status: 'active'
        },
        {
          asset_tag: 'AST002',
          name: 'HP Printer',
          category: 'Office Equipment',
          purchase_date: '2023-03-20',
          purchase_cost: 35000,
          current_value: 30000,
          location: 'Admin Office',
          status: 'active'
        },
        {
          asset_tag: 'AST003',
          name: 'Projector',
          category: 'AV Equipment',
          purchase_date: '2023-06-10',
          purchase_cost: 45000,
          current_value: 40000,
          location: 'Conference Hall',
          status: 'under_maintenance'
        }
      ];
      
      for (const asset of assets) {
        const existing = await client.query(
          'SELECT id FROM assets WHERE asset_tag = $1',
          [asset.asset_tag]
        );
        
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO assets (asset_tag, name, category, purchase_date, 
             purchase_cost, current_value, location, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [asset.asset_tag, asset.name, asset.category, asset.purchase_date,
             asset.purchase_cost, asset.current_value, asset.location, asset.status]
          );
        }
      }
      console.log(`✅ Seeded ${assets.length} assets`);
      
      // ============================================
      // 10. SEED BORROWINGS (Active borrowings)
      // ============================================
      console.log('🟡 Seeding borrowings...');
      
      // Get student and book IDs
      const studentResult = await client.query('SELECT id FROM students LIMIT 3');
      const bookResult = await client.query('SELECT id FROM books LIMIT 3');
      
      if (studentResult.rows.length > 0 && bookResult.rows.length > 0) {
        const borrowings = [
          {
            student_id: studentResult.rows[0]?.id,
            book_id: bookResult.rows[0]?.id,
            borrow_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            student_id: studentResult.rows[1]?.id,
            book_id: bookResult.rows[1]?.id,
            borrow_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        ];
        
        for (const borrowing of borrowings) {
          if (borrowing.student_id && borrowing.book_id) {
            // Check if borrowing already exists
            const existing = await client.query(
              'SELECT id FROM borrowings WHERE student_id = $1 AND book_id = $2 AND return_date IS NULL',
              [borrowing.student_id, borrowing.book_id]
            );
            
            if (existing.rows.length === 0) {
              await client.query(
                `INSERT INTO borrowings (student_id, book_id, borrow_date, due_date)
                 VALUES ($1, $2, $3, $4)`,
                [borrowing.student_id, borrowing.book_id, borrowing.borrow_date, borrowing.due_date]
              );
              
              // Update available copies
              await client.query(
                'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
                [borrowing.book_id]
              );
            }
          }
        }
        console.log(`✅ Seeded ${borrowings.length} borrowings`);
      } else {
        console.log('⚠️ Skipping borrowings seed - no students or books found');
      }
      
      await client.query('COMMIT');
      console.log('🎉 Database seeding completed successfully!');
      
      // Print summary
      console.log('\n📊 Database Summary:');
      const counts = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM students) as students,
          (SELECT COUNT(*) FROM books) as books,
          (SELECT COUNT(*) FROM employees) as employees,
          (SELECT COUNT(*) FROM suppliers) as suppliers,
          (SELECT COUNT(*) FROM stock_items) as stock_items,
          (SELECT COUNT(*) FROM vehicles) as vehicles,
          (SELECT COUNT(*) FROM assets) as assets,
          (SELECT COUNT(*) FROM users) as users
      `);
      
      console.table(counts.rows[0]);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;