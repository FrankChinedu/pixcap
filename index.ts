// class 
interface IEmployee {
  uniqueId: number;
  name: string;
  subordinates: IEmployee[]
  supervisor: {
    id: number,
    name: string
  }
}

interface IEmployees {
  key?: IEmployee[]
}

interface IEmployeeOrgApp {
  ceo: IEmployee
  employees: IEmployees
  history: IEmployees[]
  historyIndex: number

  move(employeeID: number, supervisorID: number): void;

  undo(): void;

  redo(): void;
}

class Employee implements IEmployee {
  static lastIndex = 0
  uniqueId: number;
  name: string;
  subordinates: IEmployee[] = [];
  supervisor = null;

  constructor(name: string) {
    this.name = name;
    this.uniqueId = Employee.lastIndex + 1;
    Employee.lastIndex = this.uniqueId
  }
}

const Mark = 'Mark Zuckerberg';
const Sarah = 'Sarah Donald';
const Tyler = 'Tyler Simpson';
const Bruce = 'Bruce Willis';
const Georgina = 'Georgina Flangy';
const Cassandra = 'Cassandra Reynolds';
const Mary = 'Mary Blue';
const Tina = 'Tina Teff';
const Will = 'Will Turner';
const Harry = 'Harry Tobs';
const Thomas = 'Thomas Brown';
const George = 'George Carrey';
const Gary = 'Gary Styles';
const Sophie = 'Sophie Turner';
const Bob = 'Bob Saget:';

const employeeNameLists = [
  Sarah, Tyler, Bruce, Georgina, Cassandra, Mary, Tina, Will,
  Harry, Thomas, George, Gary, Sophie, Bob
];

const subordinateTree: {supervisor: string, employee: string}[] = [
  {supervisor: Mark,  employee: Sarah},
  {supervisor: Mark,  employee: Tyler},
  {supervisor: Mark,  employee: Bruce},
  {supervisor: Mark,  employee: Georgina},
  {supervisor: Sarah,  employee: Cassandra},
  {supervisor: Cassandra,  employee: Mary},
  {supervisor: Cassandra,  employee: Bob},
  {supervisor: Bob,  employee: Tina},
  {supervisor: Tina,  employee: Will},
  {supervisor: Tyler,  employee: Harry},
  {supervisor: Tyler,  employee: George},
  {supervisor: Tyler,  employee: Gary},
  {supervisor: Harry,  employee: Thomas},
  {supervisor: Georgina,  employee: Sophie},
]

class EmployeeOrgApp implements IEmployeeOrgApp {
  employees: IEmployees = {};
  ceo: IEmployee;
  history: IEmployees[] = []
  historyIndex = 0

  constructor(ceo: IEmployee) {
    this.ceo = ceo;
    this.employees = {[ceo.uniqueId]: ceo};
    employeeNameLists.forEach(name => {
      this.addEmployee(name);
    })
    this.instantiateSubOrdinates();
    this.addToHistory(this.employees);
  }

  findEmployee(id: string| number): IEmployee | null {
    const property = {
      string: 'name',
      number: 'uniqueId'
    }
    type IValue = 'name' | 'uniqueId';
    const value: IValue = property[typeof id];

    const employeeArray = Object.values(this.employees) as IEmployee[] ;
    
    const employee = employeeArray.find(employee => employee[value] === id );

    return employee;
  }

  addEmployee(name: string) {
    const newEmployee = new Employee(name);
    if(!this.employees[newEmployee.uniqueId]) {
      this.employees[newEmployee.uniqueId] = newEmployee
    }
  }

  instantiateSubOrdinates() {
    subordinateTree.forEach(item => {
      const supervisor = this.findEmployee(item.supervisor)
      const employee = this.findEmployee(item.employee);

      if(supervisor) {
        supervisor.subordinates.push(employee);
        employee.supervisor = {
          id: supervisor.uniqueId,
          name:  supervisor.name,
        } 
      }
    })
  }

  addToHistory(state: IEmployees) {
    //this is to ensure no future event incase a move action is performed after an undo action;

    this.history = this.history.slice(0, this.historyIndex + 1);
    const _state = JSON.parse(JSON.stringify(state)) as IEmployees;

    this.history.push(_state);
    // this conditional prevent the history index from being set on initial app set up
    if(this.history.length > 1) {
      this.historyIndex++
    }
  }
  /**
   * if an action has been performed we add to the history 
   * if we undo the action we reduce the history index by 1 
   * and if another action  is performed we replace the action history
   * index from the current historyIndex
   */
  move(employeeID: number, supervisorID: number) {
    const newHistory = { employeeID, supervisorID };
    //get employee and supervisor
    const supervisor = this.findEmployee(newHistory.supervisorID)
    const employee = this.findEmployee(newHistory.employeeID);

    //get employee subOrdinates
    const subOrdinates = employee.subordinates

    //find previous Superior
    const previousSupervisor = this.findEmployee(employee.supervisor.id);

    //move employee subordinates to previous superior
    previousSupervisor.subordinates = [...previousSupervisor.subordinates, ...subOrdinates];

    employee.subordinates = [];
    //save current superior detail
    employee.supervisor = {
      id: supervisor.uniqueId,
      name: supervisor.name
    }
    //push employee to superor
    supervisor.subordinates.push(employee);
    const currentState = this.employees;

    this.addToHistory(currentState);
  };

  undo() {
    if(this.historyIndex) {
      this.historyIndex = this.historyIndex - 1;
      const state = this.history[this.historyIndex];
      this.employees = state;
    }
  }

  redo() {
    if((this.history.length - 1) > this.historyIndex) {
      this.historyIndex = this.historyIndex + 1;
      const state = this.history[this.historyIndex];
      this.employees = state;
    }
  }
}

const ceo = new Employee(Mark);
const app = new EmployeeOrgApp(ceo);

app.move(7, 5);
app.undo()
app.move(9, 4);
app.undo()
